import { prisma } from "@/lib/prisma.js";
import type {
  Address,
  CreateAddress,
  UpdateAddress,
} from "@/modules/profiles/dtos/profiles-dto.js";
import type { AddressesRepository } from "../address-repository.js";

type PrismaAddressWithRelations = Awaited<
  ReturnType<typeof prisma.address.findUnique>
>;

const mapAddress = (address: PrismaAddressWithRelations): Address | null => {
  if (!address) {
    return null;
  }

  return {
    id: address.id,
    zip_code: address.zip_code,
    street: address.street,
    number: address.number,
    complement: address.complement,
    district: address.district,
    city: address.city,
    state: address.state,
    state_code: address.state_code,
    latitude: address.latitude,
    longitude: address.longitude,
    created_at: address.created_at,
    updated_at: address.updated_at,
  };
};

export class PrismaAddressesRepository implements AddressesRepository {
  async findById(id: string) {
    const address = await prisma.address.findUnique({
      where: {
        id,
      },
    });

    return mapAddress(address);
  }

  async findByProfileId(profileId: string) {
    const profileAddress = await prisma.profileAddress.findUnique({
      where: {
        profile_id: profileId,
      },
      include: {
        address: true,
      },
    });

    return mapAddress(profileAddress?.address ?? null);
  }

  async create(data: CreateAddress) {
    const address = await prisma.$transaction(async (transaction) => {
      const createdAddress = await transaction.address.create({
        data: {
          zip_code: data.zip_code,
          street: data.street,
          number: data.number,
          complement: data.complement,
          district: data.district,
          city: data.city,
          state: data.state,
          state_code: data.state_code,
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });

      await transaction.profileAddress.create({
        data: {
          profile_id: data.profile_id,
          address_id: createdAddress.id,
        },
      });

      return createdAddress;
    });

    const mappedAddress = mapAddress(address);

    if (!mappedAddress) {
      throw new Error("Failed to create address");
    }

    return mappedAddress;
  }

  async update(id: string, data: UpdateAddress) {
    const address = await prisma.address.findUnique({
      where: {
        id,
      },
    });

    if (!address) {
      return null;
    }

    const updatedAddress = await prisma.address.update({
      where: {
        id,
      },
      data,
    });

    return mapAddress(updatedAddress);
  }
}
