// import { Model } from "mongoose";

// import { BadRequestException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
// import { getModelToken } from "@nestjs/mongoose";
// import { TestingModule } from "@nestjs/testing";

// import * as QueryFilter from "../src/common/event-filter-builder";
// import { getError, NoErrorThrownError } from "../test/error-wrapper";
// import { setupTestingModule } from "../test/test.setup";
// import { AppService } from "./app.service";
// import { EventLocationType, EventStatus, EventType } from "./common/enums";
// import { CreateEventDto } from "./dto/create-event.dto";
// import { Event, EventDocument } from "./schemas/event.schema";

// describe("AppService", () => {
//     let moduleFixture: TestingModule;
//     let service: AppService;
//     let eventModel: Model<EventDocument>;

//     const userId = "66d41196a157d90d658a15d4";

//     beforeEach(async () => {
//         moduleFixture = await setupTestingModule();
//         service = moduleFixture.get<AppService>(AppService);
//         eventModel = moduleFixture.get<Model<EventDocument>>(getModelToken(Event.name));
//     });

//     test("00 | Service Defined | ✅", () => {
//         expect(service).toBeDefined();
//     });

//     it("01 | {getAllPublicEvents} | Successfully retrieve all public events | ✅", async () => {
//         // Mock public events
//         const publicEvents = [
//             { _id: "event123", name: "Public Event 1", status: "Approved", publish: true },
//             { _id: "event456", name: "Public Event 2", status: "Approved", publish: true }
//         ];

//         // Mock filter builders
//         jest.spyOn(QueryFilter, "BuildEventFilter").mockReturnValueOnce({
//             filter: {},
//             sort: {},
//             skip: 0,
//             limit: 10
//         });

//         // Mock eventModel.find to return public events
//         jest.spyOn(eventModel, "find").mockReturnValueOnce({
//             sort: jest.fn().mockReturnThis(),
//             skip: jest.fn().mockReturnThis(),
//             limit: jest.fn().mockReturnThis(),
//             select: jest.fn().mockResolvedValueOnce(publicEvents)
//         } as never);

//         // Call service method
//         const result = await service.getAllPublicEvents({});
//         // Validate result
//         expect(result).toEqual(publicEvents);
//         expect(eventModel.find).toHaveBeenCalledWith({ status: "Approved", publish: true });
//     });

//     it("02 | {getAllPublicEvents} | Successfully handle case with no public events | ✅", async () => {
//         // Mock filter builders
//         jest.spyOn(QueryFilter, "BuildEventFilter").mockReturnValueOnce({
//             filter: {},
//             sort: {},
//             skip: 0,
//             limit: 10
//         });

//         // Mock eventModel.find to return an empty array
//         jest.spyOn(eventModel, "find").mockReturnValueOnce({
//             sort: jest.fn().mockReturnThis(),
//             skip: jest.fn().mockReturnThis(),
//             limit: jest.fn().mockReturnThis(),
//             select: jest.fn().mockResolvedValueOnce([])
//         } as never);

//         // Call service method
//         const result = await service.getAllPublicEvents({});
//         // Validate result
//         expect(result).toEqual([]);
//         expect(eventModel.find).toHaveBeenCalledWith({ status: "Approved", publish: true });
//     });

//     it("03 | {getPublicEventById} | Successfully retrieve a public event by ID | ✅", async () => {
//         // Mock event with valid details
//         const publicEvent = {
//             _id: "abcdef1234567890abcdef12",
//             name: "Public Event",
//             status: "Approved",
//             publish: true
//         };

//         // Mock findOne for event
//         jest.spyOn(eventModel, "findOne").mockResolvedValueOnce(publicEvent);

//         // Call service method
//         const result = await service.getPublicEventById("abcdef1234567890abcdef12");
//         // Validate result
//         expect(result).toEqual(publicEvent);
//         expect(eventModel.findOne).toHaveBeenCalledWith({ _id: "abcdef1234567890abcdef12", status: "Approved", publish: true });
//     });

//     it("04 | {getPublicEventById} | Deny access if event does not exist | ❌", async () => {
//         // Mock findOne for event returning null
//         jest.spyOn(eventModel, "findOne").mockResolvedValueOnce(null);

//         // Call service method
//         const error = await getError(() => service.getPublicEventById("abcdef1234567890abcdef12"));
//         // Expect an Error to be thrown
//         expect(error).not.toBeInstanceOf(NoErrorThrownError);
//         // Expect the error instance to be a NotFoundException
//         expect(error).toBeInstanceOf(NotFoundException);
//         // Expect the correct error message
//         expect((error as NotFoundException).message).toBe("event-does-not-exist");
//     });

//     it("05 | {createEvent} | Successfully create an event | ✅", async () => {
//         const createEventDto: CreateEventDto = {
//             name: "Tech Conference 2025",
//             type: EventType.CONFERENCE,
//             publish: false,
//             startDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
//             endDate: new Date(Date.now() + 1000 * 60 * 60 * 48), // 48 hours from now
//             location: { type: EventLocationType.HYBRID, url: "https://zoom.us" }
//         };

//         // Mock successful RMQ connection
//         jest.spyOn(service["usersRMQ"], "connect").mockResolvedValueOnce(undefined);
//         // Mock event creation
//         jest.spyOn(eventModel, "create").mockResolvedValueOnce({
//             _id: "event123",
//             userId,
//             status: "Pending",
//             ...createEventDto
//         } as never);
//         // Mock RMQ message sending
//         jest.spyOn(service["usersRMQ"], "send").mockReturnValueOnce({
//             subscribe: jest.fn()
//         } as never);

//         // Call service method
//         const result = await service.createEvent(userId, createEventDto);
//         // Expect success message
//         expect(result).toBe("event-creation-submitted-successfully-pending-approval");
//         // Expect RMQ to have been connected
//         expect(service["usersRMQ"].connect).toHaveBeenCalled();
//         // Expect event creation in DB
//         expect(eventModel.create).toHaveBeenCalledWith({
//             userId,
//             status: "Pending",
//             ...createEventDto
//         });
//         // Expect user credit update to be triggered
//         expect(service["usersRMQ"].send).toHaveBeenCalledWith("update_user_credit", {
//             userId,
//             eventId: "event123"
//         });
//     });

//     it("06 | {createEvent} | Deny creation if RMQ service is unavailable | ❌", async () => {
//         const createEventDto: CreateEventDto = {
//             name: "Tech Conference 2025",
//             type: EventType.CONFERENCE,
//             publish: false,
//             startDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
//             endDate: new Date(Date.now() + 1000 * 60 * 60 * 48), // 48 hours from now
//             location: { type: EventLocationType.HYBRID, url: "https://zoom.us" }
//         };

//         // Mock RMQ connection failure
//         jest.spyOn(service["usersRMQ"], "connect").mockRejectedValueOnce(new Error());

//         // Call service method
//         const error = await getError(() => service.createEvent(userId, createEventDto));
//         // Expect an Error to be thrown
//         expect(error).not.toBeInstanceOf(NoErrorThrownError);
//         // Expect the error instance to be a ServiceUnavailableException
//         expect(error).toBeInstanceOf(ServiceUnavailableException);
//         // Expect the correct error message to be returned
//         expect((error as ServiceUnavailableException).message).toBe("service-unavailable-please-try-again-later");
//         // Ensure RMQ connection was attempted
//         expect(service["usersRMQ"].connect).toHaveBeenCalled();
//         // Ensure RMQ was closed upon failure
//         expect(service["usersRMQ"].close).toHaveBeenCalled();
//     });

//     it("07 | {updateEvent} | Successfully update event | ✅", async () => {
//         const updateEventDto = { name: "Updated Event Name", publish: true };

//         // Mock current event
//         const currentEvent = {
//             _id: "event123",
//             userId,
//             status: EventStatus.APPROVED,
//             startDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // Starts in 24 hours
//             save: jest.fn().mockResolvedValueOnce("event-updated-successfully")
//         };

//         // Mock findOne for event retrieval
//         jest.spyOn(eventModel, "findOne").mockResolvedValueOnce(currentEvent);

//         // Call service method
//         const result = await service.updateEvent(userId, "event123", updateEventDto);
//         // Expect success message
//         expect(result).toBe("event-updated-successfully");
//         // Expect event model to be called correctly
//         expect(eventModel.findOne).toHaveBeenCalledWith({ _id: "event123", userId });
//         // Expect save method to be called
//         expect(currentEvent.save).toHaveBeenCalled();
//     });

//     it("08 | {updateEvent} | Deny update if event does not exist | ❌", async () => {
//         const updateEventDto = { name: "Updated Event Name" };

//         // Mock event not found
//         jest.spyOn(eventModel, "findOne").mockResolvedValueOnce(null);

//         // Call service method
//         const error = await getError(() => service.updateEvent(userId, "event123", updateEventDto as never));
//         // Expect an Error to be thrown
//         expect(error).not.toBeInstanceOf(NoErrorThrownError);
//         // Expect the error instance to be a NotFoundException
//         expect(error).toBeInstanceOf(NotFoundException);
//         // Expect the correct error message to be returned
//         expect((error as NotFoundException).message).toBe("event-does-not-exist");
//         // Expect event retrieval to be attempted
//         expect(eventModel.findOne).toHaveBeenCalledWith({ _id: "event123", userId });
//     });

//     it("09 | {updateEvent} | Deny update if event is not approved | ❌", async () => {
//         const updateEventDto = { name: "Updated Event Name" };

//         // Mock an unapproved event
//         const currentEvent = {
//             _id: "event123",
//             userId,
//             status: EventStatus.PENDING // Not approved
//         };

//         // Mock findOne for event retrieval
//         jest.spyOn(eventModel, "findOne").mockResolvedValueOnce(currentEvent);

//         // Call service method
//         const error = await getError(() => service.updateEvent(userId, "event123", updateEventDto as never));
//         // Expect an Error to be thrown
//         expect(error).not.toBeInstanceOf(NoErrorThrownError);
//         // Expect the error instance to be a NotFoundException
//         expect(error).toBeInstanceOf(NotFoundException);
//         // Expect the correct error message to be returned
//         expect((error as NotFoundException).message).toBe("can-not-update-unapproved-event");
//     });

//     it("10 | {updateEvent} | Deny update if immutable field is changed after event starts | ❌", async () => {
//         const updateEventDto = { startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) };

//         // Mock an event that has already started
//         const currentEvent = {
//             _id: "event123",
//             userId,
//             status: EventStatus.APPROVED,
//             startDate: new Date(Date.now() - 1000 * 60 * 60) // Started 1 hour ago
//         };

//         // Mock findOne for event retrieval
//         jest.spyOn(eventModel, "findOne").mockResolvedValueOnce(currentEvent);

//         // Call service method
//         const error = await getError(() => service.updateEvent(userId, "event123", updateEventDto as never));
//         // Expect an Error to be thrown
//         expect(error).not.toBeInstanceOf(NoErrorThrownError);
//         // Expect the error instance to be a BadRequestException
//         expect(error).toBeInstanceOf(BadRequestException);
//         // Expect the correct error message to be returned
//         expect((error as BadRequestException).message).toBe("startDate-can-not-be-updated-after-the-event-starts");
//     });

//     it("11 | {getAllUserEvents} | Successfully retrieve all user events without filters | ✅", async () => {
//         const filterDto = {};

//         // Mock events list
//         const mockEvents = [
//             { _id: "event1", userId, name: "Event #0", status: EventStatus.APPROVED, type: "Concert" },
//             { _id: "event2", userId, name: "Updated Event Name", status: EventStatus.APPROVED, type: "Seminar" },
//             { _id: "event3", userId, name: "Event #2", status: EventStatus.REJECTED, type: "Concert" }
//         ];

//         // Mock filter builder response
//         jest.spyOn(QueryFilter, "BuildEventFilter").mockReturnValueOnce({ filter: {}, sort: {}, skip: 0, limit: 10 });
//         // Mock find returning mock events
//         jest.spyOn(eventModel, "find").mockReturnValueOnce({
//             sort: jest.fn().mockReturnThis(),
//             skip: jest.fn().mockReturnThis(),
//             limit: jest.fn().mockResolvedValueOnce(mockEvents)
//         } as never);

//         // Call service method
//         const result = await service.getAllUserEvents(userId, filterDto);
//         // Validate response
//         expect(result).toEqual(mockEvents);
//         expect(result).toHaveLength(3);
//         expect(result.map((event) => event.name)).toEqual(expect.arrayContaining(["Event #0", "Updated Event Name", "Event #2"]));
//     });

//     it("12 | {getAllUserEvents} | Retrieve user events filtered by status (Approved) | ✅", async () => {
//         const filterDto = { status: EventStatus.APPROVED };

//         // Mock events list
//         const mockEvents = [
//             { _id: "event1", userId, name: "Event #0", status: EventStatus.APPROVED },
//             { _id: "event2", userId, name: "Updated Event Name", status: EventStatus.APPROVED }
//         ];

//         // Mock filter builder response
//         jest.spyOn(QueryFilter, "BuildEventFilter").mockReturnValueOnce({ filter: { status: EventStatus.APPROVED }, sort: {}, skip: 0, limit: 10 });
//         // Mock find returning mock events
//         jest.spyOn(eventModel, "find").mockReturnValueOnce({
//             sort: jest.fn().mockReturnThis(),
//             skip: jest.fn().mockReturnThis(),
//             limit: jest.fn().mockResolvedValueOnce(mockEvents)
//         } as never);

//         // Call service method
//         const result = await service.getAllUserEvents(userId, filterDto);
//         // Validate response
//         expect(result).toEqual(mockEvents);
//         expect(result).toHaveLength(2);
//         expect(result.every((event) => event.status === EventStatus.APPROVED)).toBeTruthy();
//     });

//     it("13 | {getAllUserEvents} | Retrieve user events sorted by startDate (asc) | ✅", async () => {
//         const filterDto = { startDate: "asc" as never };

//         // Mock sorted events
//         const mockEvents = [
//             { _id: "event1", userId, name: "Event #0", startDate: new Date("2023-01-01") },
//             { _id: "event2", userId, name: "Event #1", startDate: new Date("2023-02-01") },
//             { _id: "event3", userId, name: "Event #2", startDate: new Date("2023-03-01") }
//         ];

//         // Mock filter builder response
//         jest.spyOn(QueryFilter, "BuildEventFilter").mockReturnValueOnce({ filter: {}, sort: { startDate: 1 }, skip: 0, limit: 10 });
//         // Mock find returning mock events
//         jest.spyOn(eventModel, "find").mockReturnValueOnce({
//             sort: jest.fn().mockReturnThis(),
//             skip: jest.fn().mockReturnThis(),
//             limit: jest.fn().mockResolvedValueOnce(mockEvents)
//         } as never);

//         // Call service method
//         const result = await service.getAllUserEvents(userId, filterDto);
//         // Validate response
//         expect(result).toEqual(mockEvents);
//         expect(result[0].name).toBe("Event #0");
//     });

//     it("14 | {getAllUserEvents} | Retrieve user events filtered by type (Concert) | ✅", async () => {
//         const filterDto = { type: EventType.CONCERT };

//         // Mock events
//         const mockEvents = [
//             { _id: "event1", userId, name: "Concert A", type: "Concert" },
//             { _id: "event2", userId, name: "Concert B", type: "Concert" }
//         ];

//         // Mock filter builder response
//         jest.spyOn(QueryFilter, "BuildEventFilter").mockReturnValueOnce({ filter: { type: "Concert" }, sort: {}, skip: 0, limit: 10 });
//         // Mock find returning mock events
//         jest.spyOn(eventModel, "find").mockReturnValueOnce({
//             sort: jest.fn().mockReturnThis(),
//             skip: jest.fn().mockReturnThis(),
//             limit: jest.fn().mockResolvedValueOnce(mockEvents)
//         } as never);

//         // Call service method
//         const result = await service.getAllUserEvents(userId, filterDto);
//         // Validate response
//         expect(result).toEqual(mockEvents);
//         expect(result).toHaveLength(2);
//         expect(result.every((event) => event.type === "Concert")).toBeTruthy();
//     });

//     it("15 | {getAllUserEvents} | Retrieve nothing due to invalid filter value (type) | ❌", async () => {
//         const filterDto = { type: "InvalidType" as never };

//         // Mock filter builder response
//         jest.spyOn(QueryFilter, "BuildEventFilter").mockReturnValueOnce({ filter: { type: "InvalidType" }, sort: {}, skip: 0, limit: 10 });
//         // Mock find returning an empty array
//         jest.spyOn(eventModel, "find").mockReturnValueOnce({
//             sort: jest.fn().mockReturnThis(),
//             skip: jest.fn().mockReturnThis(),
//             limit: jest.fn().mockResolvedValueOnce([])
//         } as never);

//         // Call service method
//         const result = await service.getAllUserEvents(userId, filterDto);
//         // Validate response
//         expect(result).toEqual([]);
//         expect(result).toHaveLength(0);
//     });

//     it("16 | {getUserEventById} | Successfully retrieve an event by ID | ✅", async () => {
//         const eventId = "approvedEventId";

//         // Mock event with valid details
//         const mockEvent = {
//             _id: eventId,
//             userId,
//             name: "Updated Event Name"
//         };

//         // Mock findOne for event
//         jest.spyOn(eventModel, "findOne").mockResolvedValueOnce(mockEvent as never);

//         // Call service method
//         const result = await service.getUserEventById(userId, eventId);
//         // Expect event to be returned
//         expect(result).toBeDefined();
//         expect(result._id).toBe(eventId);
//         expect(result.userId).toBe(userId);
//         expect(result.name).toBe("Updated Event Name");
//         // Expect findOne to be called with correct arguments
//         expect(eventModel.findOne).toHaveBeenCalledWith({ _id: eventId, userId });
//     });

//     it("17 | {getUserEventById} | Deny access to an event belonging to another user | ❌", async () => {
//         const eventId = "approvedEventId";
//         const otherUserId = "otherUserId"; // Mock another user ID

//         // Mock findOne returning null (event does not belong to otherUserId)
//         jest.spyOn(eventModel, "findOne").mockResolvedValueOnce(null);

//         // Call service method
//         const error = await getError(() => service.getUserEventById(otherUserId, eventId));
//         // Expect an Error to be thrown
//         expect(error).not.toBeInstanceOf(NoErrorThrownError);
//         // Expect the error instance to be a NotFoundException
//         expect(error).toBeInstanceOf(NotFoundException);
//         // Expect the correct error message to be returned
//         expect((error as NotFoundException).message).toBe("event-does-not-exist");
//         // Expect findOne to be called with correct arguments
//         expect(eventModel.findOne).toHaveBeenCalledWith({ _id: eventId, userId: otherUserId });
//     });

//     it("18 | {getUserEventById} | Deny access due to non-existent event ID | ❌", async () => {
//         const nonExistentEventId = "nonExistentEventId";

//         // Mock findOne returning null (event not found)
//         jest.spyOn(eventModel, "findOne").mockResolvedValueOnce(null);

//         // Call service method
//         const error = await getError(() => service.getUserEventById(userId, nonExistentEventId));
//         // Expect an Error to be thrown
//         expect(error).not.toBeInstanceOf(NoErrorThrownError);
//         // Expect the error instance to be a NotFoundException
//         expect(error).toBeInstanceOf(NotFoundException);
//         // Expect the correct error message to be returned
//         expect((error as NotFoundException).message).toBe("event-does-not-exist");
//         // Expect findOne to be called with correct arguments
//         expect(eventModel.findOne).toHaveBeenCalledWith({ _id: nonExistentEventId, userId });
//     });
// });
