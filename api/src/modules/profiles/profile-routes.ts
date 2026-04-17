import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { AppError, appErrorSchema } from "../common/errors/app-error.js";
import { verifyJwt } from "../common/middlewares/verify-jwt.js";
import {
  addressSchema,
  createAddressSchema,
  createProfileSchema,
  profileSchema,
  updateAddressSchema,
  updateProfileSchema,
} from "./dtos/profiles-dto.js";
import { PrismaAddressesRepository } from "./repositories/prisma/addresses-repository-prisma.js";
import { PrismaProfilesRepository } from "./repositories/prisma/profiles-repository-prisma.js";

export async function profileRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.addHook("onRequest", async (request) => {
    await verifyJwt(request);
  });

  typedApp.post(
    "/profiles",
    {
      schema: {
        tags: ["Profiles"],
        summary: "Create user profile",
        description:
          "Creates a profile for the authenticated user. The user id is resolved from JWT.",
        body: createProfileSchema.omit({ user_id: true }),
        response: {
          200: profileSchema,
          401: appErrorSchema,
          409: appErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const profilesRepository = new PrismaProfilesRepository();

      const existingProfile = await profilesRepository.findByUserId(userId);

      if (existingProfile) {
        throw new AppError("Profile already exists", "PROFILE_ALREADY_EXISTS", 409);
      }

      const profile = await profilesRepository.create({
        ...request.body,
        user_id: userId,
      });

      return reply.send(profile);
    },
  );

  typedApp.get(
    "/profiles",
    {
      schema: {
        tags: ["Profiles"],
        summary: "Get authenticated user profile",
        description:
          "Returns the profile of the authenticated user. Address is always present and can be null.",
        response: {
          200: profileSchema.nullable(),
          401: appErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const profilesRepository = new PrismaProfilesRepository();
      const profile = await profilesRepository.findByUserId(userId);

      return reply.send(profile);
    },
  );

  typedApp.put(
    "/profiles",
    {
      schema: {
        tags: ["Profiles"],
        summary: "Update authenticated user profile",
        description:
          "Updates only profile data for the authenticated user. Address fields are not handled by this route.",
        body: updateProfileSchema,
        response: {
          200: profileSchema.nullable(),
          401: appErrorSchema,
          404: appErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const profilesRepository = new PrismaProfilesRepository();

      const profile = await profilesRepository.findByUserId(userId);

      if (!profile) {
        throw new AppError("Profile not found", "PROFILE_NOT_FOUND", 404);
      }

      const updatedProfile = await profilesRepository.update(profile.id, request.body);

      return reply.send(updatedProfile);
    },
  );

  typedApp.post(
    "/profiles/addresses",
    {
      schema: {
        tags: ["Profiles"],
        summary: "Create profile address",
        description: "Creates an address for the authenticated user's profile.",
        body: createAddressSchema.omit({ profile_id: true }),
        response: {
          200: addressSchema,
          401: appErrorSchema,
          404: appErrorSchema,
          409: appErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const profilesRepository = new PrismaProfilesRepository();
      const addressesRepository = new PrismaAddressesRepository();

      const profile = await profilesRepository.findByUserId(userId);

      if (!profile) {
        throw new AppError("Profile not found", "PROFILE_NOT_FOUND", 404);
      }

      const existingAddress = await addressesRepository.findByProfileId(profile.id);

      if (existingAddress) {
        throw new AppError("Address already exists", "ADDRESS_ALREADY_EXISTS", 409);
      }

      const address = await addressesRepository.create({
        ...request.body,
        profile_id: profile.id,
      });

      return reply.send(address);
    },
  );

  typedApp.get(
    "/profiles/addresses",
    {
      schema: {
        tags: ["Profiles"],
        summary: "Get profile address",
        description: "Returns only the authenticated user's profile address.",
        response: {
          200: addressSchema.nullable(),
          401: appErrorSchema,
          404: appErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const profilesRepository = new PrismaProfilesRepository();
      const addressesRepository = new PrismaAddressesRepository();

      const profile = await profilesRepository.findByUserId(userId);

      if (!profile) {
        throw new AppError("Profile not found", "PROFILE_NOT_FOUND", 404);
      }

      const address = await addressesRepository.findByProfileId(profile.id);

      return reply.send(address);
    },
  );

  typedApp.put(
    "/profiles/addresses",
    {
      schema: {
        tags: ["Profiles"],
        summary: "Update profile address",
        description: "Updates only address data for the authenticated user's profile.",
        body: updateAddressSchema,
        response: {
          200: addressSchema.nullable(),
          401: appErrorSchema,
          404: appErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const profilesRepository = new PrismaProfilesRepository();
      const addressesRepository = new PrismaAddressesRepository();

      const profile = await profilesRepository.findByUserId(userId);

      if (!profile) {
        throw new AppError("Profile not found", "PROFILE_NOT_FOUND", 404);
      }

      const address = await addressesRepository.findByProfileId(profile.id);

      if (!address) {
        throw new AppError("Address not found", "ADDRESS_NOT_FOUND", 404);
      }

      const updatedAddress = await addressesRepository.update(address.id, request.body);

      return reply.send(updatedAddress);
    },
  );
}
