import { compare, hash } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { createUserSchema, userSchema } from "./dtos/users-dto.js";
import { InvalidCredentialsError } from "./errors/invalid-credentials-error.js";
import { UserAlreadyExistsError } from "./errors/user-already-exists-error.js";
import { PrismaUsersRepository } from "./repositories/prisma/users-repository-prisma.js";

export async function userRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post(
    "/register",
    {
      schema: {
        tags: ["Users"],
        summary: "Register a new user",
        description: "Creates a new user account with the provided information.",
        body: createUserSchema,
        response: {
          200: userSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const password_hash = await hash(password, 6);
      const usersRepository = new PrismaUsersRepository();
      const userWithSameEmail = await usersRepository.findByEmail(email);

      if (userWithSameEmail) {
        throw new UserAlreadyExistsError();
      }

      const user = await usersRepository.create({
        email,
        password: password_hash,
      });

      reply.send(user);
    },
  );

  typedApp.post(
    "/auth",
    {
      schema: {
        tags: ["Users"],
        summary: "Authenticate a user",
        description: "Authenticates a user and returns a token.",
        body: createUserSchema,
        response: {
          200: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const usersRepository = new PrismaUsersRepository();
      const user = await usersRepository.findByEmail(email);

      if (!user) {
        throw new InvalidCredentialsError();
      }

      const doestPasswordMatches = await compare(password, user.password);

      if (!doestPasswordMatches) {
        throw new InvalidCredentialsError();
      }

      const token = await reply.jwtSign(
        {
          user: user,
        },
        {
          sign: {
            sub: user.id,
          },
        },
      );

      reply.send({
        token,
      });
    },
  );
}
