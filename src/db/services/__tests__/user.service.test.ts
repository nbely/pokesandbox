import {
    createUser,
    deleteAllUsers,
    findUser,
    upsertUser
  } from "../user.service";
  
  describe("user service", () => {
    afterAll(async () => {
      await deleteAllUsers();
    });
  
    afterEach(async () => {
      await deleteAllUsers();
    });
  
    const userPayload = {
        userId: "5432185765483",
        userName: "Chronicler",
        userTag: "Chronicler#1131",
    };
  
    describe("create user", () => {
      describe("given the input is valid", () => {
        it("should create a new user", async () => {
          const user = await createUser(userPayload);
    
          expect(user.userId).toBe(userPayload.userId);
  
          expect(user.userName).toBe(userPayload.userName);
  
          expect(user.userTag).toBe(userPayload.userTag);
        });
      });
    });
  
    // describe("virtual property", () => {
    //   it("should return the user full name", async () => {
    //     await createUser(userPayload);
  
    //     const user = await findUser(
    //       { email: userPayload.email },
    //       { lean: false }
    //     );
  
    //     expect(user?.fullName).toBe(
    //       `${userPayload.firstName} ${userPayload.lastName}`
    //     );
    //   });
    // });
  });
  