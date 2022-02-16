/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import store from "../__mocks__/store";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page and I select a file as Justificatif", () => {
    test("Then the input will change", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBillBoard = new NewBill({
        document,
        onNavigate,
        store: store,
        localStorage: window.localStorage,
      });

      const handleChangeFileMoked = jest.fn(newBillBoard.handleChangeFile);
      const chooseFileButton = screen.getByTestId("file");

      chooseFileButton.addEventListener("change", handleChangeFileMoked);

      const file = new File(["test.png"], "test.png", { type: "image/png" });
      fireEvent.change(chooseFileButton, {
        target: {
          files: [file],
        },
      });

      expect(handleChangeFileMoked).toHaveBeenCalled();
      expect(chooseFileButton.files[0].name).toBe("test.png");
    });
  });
  describe("When I am on NewBill Page and I click on submit button", () => {
    test("A new bill is created ", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBillBoard = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const handleSubmitMoked = jest.fn(newBillBoard.handleSubmit);
      const submit = screen.getByTestId("form-new-bill");

      submit.addEventListener("submit", handleSubmitMoked);
      fireEvent.submit(submit);

      expect(handleSubmitMoked).toHaveBeenCalled();

      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });
});

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I create new bill", () => {
    test("send bill to mock API POST", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      jest.spyOn(mockStore, "bills");

      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: (bill) => {
            return Promise.resolve();
          },
        };
      });

      await new Promise(process.nextTick);
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
      test("send bill to mock API POST", async () => {
        localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        window.onNavigate(ROUTES_PATH.NewBill);
        jest.spyOn(mockStore, "bills");

        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: (bill) => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });

        await new Promise(process.nextTick);
        const html = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = html;
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
      test("send bill to mock API POST", async () => {
        localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        window.onNavigate(ROUTES_PATH.NewBill);
        jest.spyOn(mockStore, "bills");

        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: (bill) => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        await new Promise(process.nextTick);
        const html = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = html;
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
