import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import firebase from "../__mocks__/firebase";
import firestore from "../app/Firestore.js";
import { ROUTES } from "../constants/routes";

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

  test("Then as an employee I can submit a bill", () => {
    const html = NewBillUI();
    document.body.innerHTML = html;

    const onNavigate = jest.fn((pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    });

    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "42@billed.com",
      })
    );

    const newBills = new NewBill({
      document,
      localStorage: window.localStorage,
      onNavigate,
      firestore: null,
    });

    const handleSubmit = jest.fn(newBills.handleSubmit);
    const formNewBill = screen.queryByTestId("form-new-bill");
    formNewBill.addEventListener("submit", handleSubmit);
    fireEvent.submit(formNewBill);
    expect(handleSubmit).toHaveBeenCalled();
  });

  test("send bills to mock API POST", async () => {
    const bill = {
      vat: "80",
      fileUrl:
        "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
      type: "Hôtel et logement",
      commentary: "séminaire billed",
      name: "encore",
      fileName: "preview-facture-free-201801-pdf-1.jpg",
      date: "2004-04-04",
      amount: 400,
      commentAdmin: "ok",
      email: "a@a",
      pct: 20,
    };
    const postSpy = jest.spyOn(firebase, "post");
    const response = await firebase.post(bill);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(response).toBe(`${bill.name} => 200`);
  });
});
