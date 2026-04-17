import { prisma } from "@/lib/prisma.js";
import type {
  Address,
  CreateProfile,
  Profile,
  UpdateProfile,
} from "@/modules/profiles/dtos/profiles-dto.js";
import type { ProfilesRepository } from "../profiles-repository.js";

type PrismaAddressWithRelations = {
  id: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  state_code: string;
  latitude: number | null;
  longitude: number | null;
  created_at: Date;
  updated_at: Date;
};

type PrismaProfileWithRelations = {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string;
  cpf: string;
  phone: string;
  email: string;
  is_collector: boolean;
  created_at: Date;
  updated_at: Date;
  profile_address?: {
    address: PrismaAddressWithRelations;
  } | null;
} | null;

const mapProfile = (profile: PrismaProfileWithRelations): Profile | null => {
  if (!profile) {
    return null;
  }

  const address = profile.profile_address?.address;

  return {
    id: profile.id,
    user_id: profile.user_id,
    full_name: profile.full_name,
    display_name: profile.display_name,
    cpf: profile.cpf,
    phone: profile.phone,
    email: profile.email,
    is_collector: profile.is_collector,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    address: address
      ? ({
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
        } satisfies Address)
      : undefined,
  };
};

export class PrismaProfilesRepository implements ProfilesRepository {
  async findById(id: string) {
    const profile = await prisma.profile.findUnique({
      where: {
        id,
      },
      include: {
        profile_address: {
          include: {
            address: true,
          },
        },
      },
    });

    return mapProfile(profile as PrismaProfileWithRelations) as Profile;
  }

  async findByUserId(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        profile_address: {
          include: {
            address: true,
          },
        },
      },
    });

    return mapProfile(profile as PrismaProfileWithRelations) as Profile;
  }

  async create(data: CreateProfile) {
    const profile = await prisma.profile.create({
      data: {
        user_id: data.user_id,
        full_name: data.full_name,
        display_name: data.display_name,
        cpf: data.cpf,
        phone: data.phone,
        email: data.email,
        is_collector: data.is_collector,
      },
      include: {
        profile_address: {
          include: {
            address: true,
          },
        },
      },
    });

    const mappedProfile = mapProfile(profile as PrismaProfileWithRelations);

    if (!mappedProfile) {
      throw new Error("Failed to create profile");
    }

    return mappedProfile;
  }

  async update(id: string, data: UpdateProfile) {
    const currentProfile = await prisma.profile.findUnique({
      where: {
        id,
      },
      include: {
        profile_address: {
          include: {
            address: true,
          },
        },
      },
    });

    if (!currentProfile) {
      return null;
    }

    const profile = await prisma.profile.update({
      where: {
        id,
      },
      data,
      include: {
        profile_address: {
          include: {
            address: true,
          },
        },
      },
    });

    return mapProfile(profile as PrismaProfileWithRelations) as Profile;
  }
}
