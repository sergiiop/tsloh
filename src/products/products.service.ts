import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { BadRequestException } from '@nestjs/common/exceptions'
import { Logger } from '@nestjs/common/services'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { CreateProductDto } from './dto/create-product.dto'
import type { UpdateProductDto } from './dto/update-product.dto'
import { Product } from './entities/product.entity'

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService')
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      // if (!createProductDto.slug) {
      //   createProductDto.slug = createProductDto.title
      //     .toLocaleLowerCase()
      //     .replaceAll(' ', '_')
      //     .replaceAll("'", '')
      // }
      const product = this.productRepository.create(createProductDto)

      await this.productRepository.save(product)

      return product
    } catch (error) {
      this.handleDBException(error)
    }
  }

  findAll() {
    return `This action returns all products`
  }

  findOne(id: number) {
    return `This action returns a #${id} product`
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`
  }

  remove(id: number) {
    return `This action removes a #${id} product`
  }

  private handleDBException(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail)
    }

    this.logger.error(error)

    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    )
  }
}
