// import { ConfigService } from "@nestjs/config";
// import { JwtService } from "@nestjs/jwt";
// import { getModelToken } from "@nestjs/mongoose";
// import { Test } from "@nestjs/testing";

// import { AppService } from "../src/app.service";
// import { EmailService } from "../src/integration/email.service";
// import { Event } from "../src/schemas/event.schema";

// export async function setupTestingModule() {
//     const moduleFixture = await Test.createTestingModule({
//         providers: [
//             AppService,
//             {
//                 provide: ConfigService,
//                 useValue: {
//                     get: jest.fn()
//                 }
//             },
//             JwtService,
//             {
//                 provide: getModelToken(Event.name),
//                 useValue: {
//                     find: jest.fn(),
//                     findOne: jest.fn(),
//                     updateOne: jest.fn(),
//                     deleteOne: jest.fn(),
//                     create: jest.fn(),
//                     startSession: jest.fn().mockResolvedValue({
//                         startTransaction: jest.fn(),
//                         commitTransaction: jest.fn(),
//                         abortTransaction: jest.fn(),
//                         endSession: jest.fn()
//                     })
//                 }
//             },
//             {
//                 provide: "USERS_SERVICE",
//                 useValue: {
//                     connect: jest.fn(),
//                     close: jest.fn(),
//                     send: jest.fn().mockReturnValue({ subscribe: jest.fn() })
//                 }
//             },
//             {
//                 provide: EmailService,
//                 useValue: {
//                     sendEmail: jest.fn()
//                 }
//             }
//         ]
//     }).compile();

//     return moduleFixture;
// }
