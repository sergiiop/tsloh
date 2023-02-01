import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  OneToMany,
} from 'typeorm'
import { ProductImage } from './product-image.entity'

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', {
    unique: true,
  })
  title: string

  @Column('float', {
    default: 0,
  })
  price: number

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string

  @Column('text', {
    unique: true,
  })
  slug: string

  @Column('int', {
    default: 0,
  })
  stock: number

  @Column('text', {
    array: true,
  })
  sizes: string[]

  @Column('text')
  gender: string

  @Column('text', {
    array: true,
    default: [],
  })
  tags: string[]

  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  }) // muchos a muchos
  images?: ProductImage[]

  @BeforeInsert()
  checkSlugInsert() {
    if (this.slug === null) {
      this.slug = this.title
    }

    this.slug = this.slug.toLowerCase().replaceAll(' ', '_').replaceAll("'", '')
  }
}
