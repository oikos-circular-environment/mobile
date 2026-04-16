import fastifyCookie from "@fastify/cookie";
import { fastifyCors } from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { fastifySwagger } from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "@/env";
import { AppError } from "./modules/common/errors/app-error";
import { companiesRoutes } from "./modules/companies/route";
import { usersRoutes } from "./modules/users/routes";

export const app = Fastify({
  logger: true,
}).withTypeProvider<ZodTypeProvider>();

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: "refreshToken",
    signed: false,
  },
  sign: {
    expiresIn: "7d",
  },
});

app.register(fastifyCookie);

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(fastifyCors, {
  origin: "*",
});

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Oikos Documentation",
      version: "1.0.0",
      contact: {
        name: "Christian Cesar",
        email: "christian.cesar@gmail.com",
      },
    },
  },
  transform: jsonSchemaTransform,
});

app.register(ScalarApiReference, {
  routePrefix: "/docs",
  configuration: {
    favicon: "https://avatars.githubusercontent.com/u/276378809?s=96&v=4",
    theme: "fastify",
    metaData: {
      title: "Oikos Documentation",
      description: "Boosting the circular economy",
    },
    servers: [
      {
        url: "https://api.oikos.dev",
        description: "Production server",
      },
      {
        url: `http://localhost:${env.PORT}`,
        description: "Local development server",
        variables: {
          port: {
            default: "3000",
          },
        },
      },
    ],
  },
});

app.register(usersRoutes, { prefix: "/v1/users" });
app.register(companiesRoutes, { prefix: "/v1/companies" });

app.setErrorHandler((error, _, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode ?? 400).send({
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      validation: error.validation,
    });
  }

  if (env.NODE_ENV !== "production") {
    console.error(error);
  } else {
    // TODO: Here we should log to a external tool like DataDog/NewRelic/Sentry
  }

  // return reply.status(500).send({ message: "Internal server error." });
});
