import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WeightEntriesService } from './weight-entries.service';
import { WeightEntriesRepository } from './weight-entries.repository';
import { WeightEntryRow } from './interfaces/weight-entry.interface';

// This function is a Factory Pattern. It is used to quickly generate test objects
// (fake database data) without repeating 10 lines of code in every test.
// 'overrides: Partial<WeightEntryRow> = {}': indicates that the `overrides`
// parameter will accept an object containing some or none of the `WeightEntryRow`
// properties.
// = {} assigns an empty object by default if buildRow() is called without
// arguments.
function buildRow(overrides: Partial<WeightEntryRow> = {}): WeightEntryRow {
  return {
    id: '1',
    public_id: 'a1b2c3d4-0000-0000-0000-000000000000',
    user_id: 'user-1',
    entry_date: '2026-09-18',
    weight_kg: '72.50',
    created_at: new Date('2026-09-18T00:00:00Z'),
    // It copies all default properties into the returned object.
    // If an argument is passed —for example: `buildRow({ public_id: 'second-id' })`— the spread
    // operator overwrites the default `public_id` property (`a1b2c3d...`) with `'second-id'`.
    ...overrides,
  };
}

// "describe('name', () => { ... })" is a logical grouping of tests. The first
// argument is a plain-text label, and the second is a callback that
// encapsulates the tests.
//
// This first 'describe' encapsulates all tests for the WeightEntriesService class.
// Each method of the service has its own nested 'describe' block.
describe('WeightEntriesService', () => {
  let service: WeightEntriesService;
  // Only the shape of the repository is needed, not a real implementation.
  // jest.Mocked<T> simulates that an async function was resolved or fail without run
  // any code, and that all methods are jest.fn() mocks. (this works hand by hand with
  // the mockResolvedValue/mockRejectedValu methods below)
  //
  // jest.Mocked<T>:
  // Tells TypeScript that this object simulates the real class, but that all its 
  // methods are Jest mock functions (jest.fn()) so it's possible to control their
  // return values.
  let repository: jest.Mocked<WeightEntriesRepository>;

  // beforeEach(): runs before run every `it` block below. That's work, becuase
  // it gives each test a fresh mock repository and service instance, so
  // the tests don't interfere with each other.
  beforeEach(async () => {
    // Test.createTestingModule creates a miniature AppModule for testing purposes:
    // with the real dependencies, but with a test repository ("useValue") instead of the real one.
    // This avoids starting the whole NestJS app. This is faster and more isolated.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeightEntriesService,
        {
          // "provide" the same token Nest's DI would normally use...
          provide: WeightEntriesRepository,
          // ...but hand it a fake object instead of the real class.
          // This is what makes it a *unit* test: no real repository,
          // no real database connection, ever touched.
          //
          // useValue: Instead of instantiating the real repository (which would connect to PostgreSQL),
          // A fake object is injected using jest.fn() for each method.
          useValue: {
            // jest.fn(): creates an spy/simulate function (mock) that . That's a function that
            // doesn't run any real code, but can be configured to return a value or throw an
            // error. It also tracks how many times it was called and with what arguments.
            // So, jest.fn() is part of the Jest's API for simulation
            //
            // There is an entry by each method of the repository, because it replaces the 
            // real class "WeightEntriesRepository" with a fake object that has the same
            // shape (same methods) but no real implementation.
            create: jest.fn(),
            findAllByUser: jest.fn(),
            findOneByPublicIdAndUser: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    // Extract the instances created by the NestJS testing module
    service = module.get(WeightEntriesService); //TODO: validate what does this line and the next one do, and why they are necessary
    repository = module.get(WeightEntriesRepository);
  });

  describe('create', () => {
    // it() or test(): Defines an individual test case, which are agrupated
    // by describe()
    //
    // it('description', () => { ... }): This is the individual test. The word
    // "it" comes from the English phrase "it should do X." It takes the
    // description of what the code is expected to fulfill and the function
    // that executes that expected behavior (expect).
    it('returns a mapped response when the repository succeeds', async () => {
      // For each test ("it"), it's used the AAA pattern (3 sections by each
      // method): Arrange — Act — Assert. This is a common pattern in unit
      // testing to structure tests clearly.

      // Arrange: prepare the environment (set up the conditions for the test
      // including any mock return values)
      const dto = { entryDate: '2026-09-18', weightKg: 72.5 };
      // When the "mockResolvedValue()" is called, the real respository.create is not
      // called, instead the mock returns the specified value. So the "mockResolvedValue()"
      // sets the scenario for the test, doing something like this "When
      // someone calls you (respository.create) during this test, answer with this fake
      // object."
      repository.create.mockResolvedValue(buildRow());

      // Act: Execute the action to be tested
      // Related to "repository.create.mockResolvedValue(buildRow());": when the service.create()
      // is called, it will call the repository.create() method, which is mocked to return the value
      // of buildRow(), so the service.create() will receive that fake object and map it to the
      // expected response shape.
      //
      // 'as never' bypasses DTO type validation in the test to simplify data submission.
      // as never: as service.create expects to receive an instantiated
      // "CreateWeightEntryDto" class validated by class-validator, and here, there is
      // only a plane object with 'entryDate: '2026-09-18', weightKg: 72.5', so 
      // the typescript validator will throw an error "That plane object is not of
      // type 'CreateWeightEntryDto'". So, "dto as never" is used to tell TypeScript
      // "Ignore the validation of the structure and trus in this case".
      const result = await service.create('user-1', dto as never); // This verifies service

      // Assert: Verify results
      // "toHaveBeenCalledWith": Verifies that the repository was called with exactly those parameters.
      expect(repository.create).toHaveBeenCalledWith('user-1', dto.entryDate, dto.weightKg);  // This verifies repository

      // toEqual: Compares the value returned by the service with the expected structure (data mapping).
      // Note: Internal id/user_id must never leak into the response shape.
      expect(result).toEqual({
        publicId: 'a1b2c3d4-0000-0000-0000-000000000000',
        entryDate: '2026-09-18',
        weightKg: 72.5, // note: number, not the '72.50' string pg returned
        createdAt: new Date('2026-09-18T00:00:00Z'),
      });
    });

    it('throws ConflictException when the repository reports a unique violation', async () => {
      // Arrange: simulate the exact shape of a pg unique_violation error
      // mockRejectedValue(): Simulates a database call failure and threw an error, in this
      // case, Postgres error '23505' (unique index violation / duplicate record).
      repository.create.mockRejectedValue({ code: '23505' });

      // Act + Assert combined here.
      // As the real service.create is configured to encapsulate the '23505' postgres error and
      // throw a NestJS ConflictException instead, the next code line verifies that the service
      // behaves as expected: with 'service.create('user-1', {} as never)' the service.create()
      // is called with a fake user id and a fake DTO ({} as never), and then, with the expect(...),
      // the test expects that the service will throw a ConflictException (HTTP 409).
      // 'rejects.toThrow(ConflictException)': this verifies precisely that the service
      // caught the internal database error and threw it as a `ConflictException`.
      // rejects.toThrow(): Captures the rejected promise and verifies that the service
      // transforms the error into a NestJS HTTP exception.
      await expect(service.create('user-1', {} as never)).rejects.toThrow(ConflictException);
    });

    it('rethrows unrelated errors instead of swallowing them', async () => {
      const dbError = new Error('connection lost');
      repository.create.mockRejectedValue(dbError);

      // 'rejects.toThrow(dbError)': this verifies that the real service rethrows the
      // unrelated error instead of swallowing it.
      await expect(service.create('user-1', {} as never)).rejects.toThrow(dbError);
    });
  });

  describe('findOne', () => {
    it('returns the mapped entry when the user owns it', async () => {
      repository.findOneByPublicIdAndUser.mockResolvedValue(buildRow());

      const result = await service.findOne('a1b2c3d4-0000-0000-0000-000000000000', 'user-1');

      // toBe(): validates that the service returned the expected public_id, whitout changing the publicId
      expect(result.publicId).toBe('a1b2c3d4-0000-0000-0000-000000000000');
    });

    it('throws NotFoundException when the row does not exist or belongs to someone else', async () => {
      // The repository returns null in both cases (wrong owner or truly
      // missing) — this test locks in that the service can't tell them
      // apart either, which is the whole point of retunr the 404 error
      // instead of 403.
      repository.findOneByPublicIdAndUser.mockResolvedValue(null);

      await expect(service.findOne('some-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('maps every row returned by the repository', async () => {
      repository.findAllByUser.mockResolvedValue([buildRow(), buildRow({ public_id: 'second-id' })]);

      // This call the service's "findAll" method to retrieve the weight
      // records for user 'user-1', and as the repository is mocked to return two rows,
      // the service will map those two rows into the expected response shape.
      // This was done to verify that the service correctly maps all rows
      // returned by the repository (the service method was configurated
      // to handle and return several rows).
      const result = await service.findAll('user-1');

      // toHaveLength(): Verify that the array returned by the service has
      // exactly two elements, matching the two elements ([buildRow(), buildRow(...)])
      // that was instructed the mocked repository to return.
      // It was done because the repository and the service are configurated to handle
      // more than one row, and this test verifies that the service correctly maps all rows.
      expect(result).toHaveLength(2);
      // Validate the second row's data wasn't overwritten by the first row's data.
      expect(result[1].publicId).toBe('second-id');
    });
  });

  describe('remove', () => {
    it('deletes by internal id after verifying ownership', async () => {
      repository.findOneByPublicIdAndUser.mockResolvedValue(buildRow({ id: '42' }));

      await service.remove('a1b2c3d4-0000-0000-0000-000000000000', 'user-1');

      // Confirms the service passes the internal bigint id to delete(),
      // never the public_id — delete() operates on the PK, not the API-facing id.
      expect(repository.delete).toHaveBeenCalledWith('42');
    });
  });
});