import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { CreateUserDto, LoginUserDto } from './dto'
import { User } from './entities/user.entity'
import * as bcrpyt from 'bcrypt'
import type { JwtPayload } from './interface/jwt-payload.interface'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto
      const user = this.userRepository.create({
        ...userData,
        password: bcrpyt.hashSync(password, 10),
      })

      await this.userRepository.save(user)

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
        roles: user.roles,
        token: this.getJwtToken({ id: user.id }),
      }
    } catch (error) {
      this.handleDBErrors(error)
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto

    console.log(email)
    console.log(password)

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true },
    })

    console.log(user)

    if (!user)
      throw new UnauthorizedException('Credentials are not valid (email)')

    if (!bcrpyt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Credentials are not valid (password)')
    }
    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    }
    // TODO: JWT
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload)
    return token
  }

  private handleDBErrors(error: any): never {
    if ((error.code = '23505')) {
      throw new BadRequestException(error.detail)
    }

    throw new InternalServerErrorException('Please check server logs')
  }
}
