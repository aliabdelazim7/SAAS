import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from '@crm/dto';
import { TenantContext } from '@crm/database';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateProductDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    // 1. Verify SKU uniqueness for all variants within this tenant
    const skus = createDto.variants.map((v) => v.sku).filter(Boolean) as string[];
    if (skus.length > 0) {
      const existingVariants = await this.prisma.productVariant.findMany({
        where: { sku: { in: skus }, tenantId },
      });
      if (existingVariants.length > 0) {
        throw new ConflictException(
          `SKU already exists: ${existingVariants.map((ev) => ev.sku).join(', ')}`
        );
      }
    }

    // 2. Perform creation in a transaction
    return this.prisma.$transaction(async (tx) => {
      // A. Create the Product
      const product = await tx.product.create({
        data: {
          tenantId,
          name: createDto.name,
          description: createDto.description,
          categoryId: createDto.categoryId,
          brand: createDto.brand,
          isVariantParent: createDto.isVariantParent ?? false,
        },
      });

      // B. Create the Variants
      const variantData = createDto.variants.map((v) => {
        // Auto-generate SKU if not provided
        const skuSuffix =
          v.sku ??
          `PRD-${product.name.substring(0, 3).toUpperCase()}-${Math.floor(
            100000 + Math.random() * 900000
          )}`;

        // Auto-generate barcode if not provided
        const barcodeSuffix =
          v.barcode ?? `200${Math.floor(1000000000 + Math.random() * 9000000000)}`;

        return {
          tenantId,
          productId: product.id,
          sku: skuSuffix.toUpperCase(),
          barcode: barcodeSuffix,
          price: v.price,
          costPrice: v.costPrice,
          attributes: v.attributes,
        };
      });

      await tx.productVariant.createMany({
        data: variantData,
      });

      return tx.product.findUnique({
        where: { id: product.id },
        include: { variants: true },
      });
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }

    return this.prisma.product.findMany({
      where: { tenantId },
      include: { variants: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new NotFoundException('Product not found.');
    }

    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { variants: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  async remove(id: string) {
    await this.findOne(id); // Verifies existence within tenant context

    await this.prisma.product.delete({
      where: { id },
    });

    return { success: true };
  }
}
