import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import firestore from "../app/Firestore.js";

jest.mock("../app/Firestore.js", () => {
  return {
    storage: {
      ref: jest.fn(() => {
        return {
          put: () => {
            return Promise.resolve({
              ref: {
                getDownloadURL: async () => {
                  return Promise.resolve("fakeurl");
                },
              },
            });
          },
        };
      }),
    },
  };
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I can upload an image with a good extention", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // const firestoreMock = jest.fn(firestore);
      const newBills = new NewBill({
        document,
        localStorage: window.localStorage,
        onNavigate: jest.fn(),
        firestore,
      });

      window.alert = jest.fn();

      const handleChangeFile = jest.fn(newBills.handleChangeFile);
      const file = screen.queryByTestId("file");

      const image = new File(["42"], "test.png", { type: "image/png" });
      Object.defineProperty(file, "files", {
        value: [image],
      });
      Object.defineProperty(file, "value", {
        value: image.name,
      });

      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file);
      expect(handleChangeFile).toHaveBeenCalled();
    });
  });

  test("Then I cannot upload a file which is not an image", () => {
    const html = NewBillUI();
    document.body.innerHTML = html;

    const newBills = new NewBill({
      document,
      localStorage: window.localStorage,
      onNavigate: jest.fn(),
      firestore: jest.fn(),
    });

    window.alert = jest.fn();

    const handleChangeFile = jest.fn(newBills.handleChangeFile);
    const file = screen.queryByTestId("file");
    fireEvent.change(file);
    expect(window.alert).toHaveBeenCalled();
  });
});
