import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common/exceptions'
import { Logger } from '@nestjs/common/services'
import { InjectRepository } from '@nestjs/typeorm'
import type { PaginationDto } from 'src/common/dtos/pagination.dto'
import { validate as isUUID } from 'uuid'
import { DataSource, Repository } from 'typeorm'
import type { CreateProductDto } from './dto/create-product.dto'
import type { UpdateProductDto } from './dto/update-product.dto'
import { Product } from './entities/product.entity'
import { ProductImage } from './entities'

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource,
  ) {}

  private handleDBException(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail)
    }

    this.logger.error(error)

    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    )
  }

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImageRepository.create({ url: image }),
        ),
      })

      await this.productRepository.save(product)

      return { ...product, images }
    } catch (error) {
      this.handleDBException(error)
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
    })

    return products.map(({ images, ...rest }) => ({
      ...rest,
      images: images?.map((img) => img.url),
    }))
  }

  async findOne(term: string) {
    try {
      let product: Product | null

      if (isUUID(term)) {
        product = await this.productRepository.findOneBy({ id: term })
      } else {
        const queryBuilder = this.productRepository.createQueryBuilder('prod')
        product = await queryBuilder
          .where('UPPER(title) =:title or slug =: slug', {
            title: term.toUpperCase(),
            slug: term.toLowerCase(),
          })
          .leftJoinAndSelect('prod.images', 'prodImages')
          .getOne()
      }
      return product
    } catch (error) {
      console.log(error)
    }
  }

  async findOnePlain(term: string) {
    const product = await this.findOne(term)

    return {
      ...product,
      images: product?.images?.map((image) => image.url),
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto
    const product = await this.productRepository.preload({
      id,
      ...toUpdate,
    })

    if (!product)
      throw new NotFoundException(`Product with id: ${id} not found`)

    // transsacciones
    const queryRunner = this.dataSource.createQueryRunner()

    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, {
          product: { id },
        })

        product.images = images.map((image) =>
          this.productImageRepository.create({ url: image }),
        )
      }

      await queryRunner.manager.save(product)

      // aplicar cambios si todo esta ok
      await queryRunner.commitTransaction()
      await queryRunner.release()

      // await this.productRepository.save(product)
      return await this.findOnePlain(id)
    } catch (error) {
      await queryRunner.rollbackTransaction()
      await queryRunner.release()
      this.handleDBException(error)
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id)
    if (product) await this.productRepository.remove(product)
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product')

    try {
      return await query.delete().where({}).execute()
    } catch (error) {
      this.handleDBException(error)
    }
  }
}
