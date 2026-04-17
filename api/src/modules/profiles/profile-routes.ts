import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
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

type JwtPayload = {
  sub?: string;
  user?: {
    id?: string;
  };
};

const errorResponseSchema = z.object({
  message: z.string(),
});

function getUserIdFromRequest(request: FastifyRequest): string {
  const payload = request.user as JwtPayload;
  const userId = payload.sub ?? payload.user?.id;

  if (!userId) {
    throw new Error("Invalid token payload");
  }

  return userId;
}

export async function profileRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.addHook("onRequest", async (request, reply) => {
    await verifyJwt(request, reply);
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
          401: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = getUserIdFromRequest(request);
      const profilesRepository = new PrismaProfilesRepository();

      const existingProfile = await profilesRepository.findByUserId(userId);

      if (existingProfile) {
        return reply.status(409).send({ message: "Profile already exists" });
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
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = getUserIdFromRequest(request);
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
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = getUserIdFromRequest(request);
      const profilesRepository = new PrismaProfilesRepository();

      const profile = await profilesRepository.findByUserId(userId);

      if (!profile) {
        return reply.status(404).send({ message: "Profile not found" });
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
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = getUserIdFromRequest(request);
      const profilesRepository = new PrismaProfilesRepository();
      const addressesRepository = new PrismaAddressesRepository();

      const profile = await profilesRepository.findByUserId(userId);

      if (!profile) {
        return reply.status(404).send({ message: "Profile not found" });
      }

      const existingAddress = await addressesRepository.findByProfileId(profile.id);

      if (existingAddress) {
        return reply.status(409).send({ message: "Address already exists" });
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
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = getUserIdFromRequest(request);
      const profilesRepository = new PrismaProfilesRepository();
      const addressesRepository = new PrismaAddressesRepository();

      const profile = await profilesRepository.findByUserId(userId);

      if (!profile) {
        return reply.status(404).send({ message: "Profile not found" });
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
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = getUserIdFromRequest(request);
      const profilesRepository = new PrismaProfilesRepository();
      const addressesRepository = new PrismaAddressesRepository();

      const profile = await profilesRepository.findByUserId(userId);

      if (!profile) {
        return reply.status(404).send({ message: "Profile not found" });
      }

      const address = await addressesRepository.findByProfileId(profile.id);

      if (!address) {
        return reply.status(404).send({ message: "Address not found" });
      }

      const updatedAddress = await addressesRepository.update(address.id, request.body);

      return reply.send(updatedAddress);
    },
  );
}
