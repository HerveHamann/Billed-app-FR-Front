/**
 * @jest-environment jsdom
 */

import { screen, waitFor, getByTestId } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.className).toBe("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  describe("when I click on the new bill button", () => {
    test("it should display the new bill page", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = BillsUI({ data: { bills } });

      const billBoard = new Bills({
        document,
        onNavigate,
        store: null,

        localStorage: window.localStorage,
      });

      const handleClickNewBillMoked = jest.fn((e) => billBoard.handleClickNewBill());
      const newBillButton = screen.getByTestId("btn-new-bill");

      newBillButton.addEventListener("click", handleClickNewBillMoked);

      userEvent.click(newBillButton);

      expect(handleClickNewBillMoked).toHaveBeenCalled();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
  });

  describe("when I click on the eye button", () => {
    test("it should display the justificate modal", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      $.fn.modal = jest.fn();

      document.body.innerHTML = BillsUI({ data: [bills[0]] });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const store = null;

      const billBoard = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const eyeButton = screen.getByTestId("icon-eye");
      const handleClickIconEyeMoked = jest.fn(billBoard.handleClickIconEye);

      eyeButton.addEventListener("click", () => handleClickIconEyeMoked(eyeButton));

      userEvent.click(eyeButton);
      expect(handleClickIconEyeMoked).toHaveBeenCalled();
      const modale = document.getElementById("modaleFile");
      expect(modale).toBeTruthy();
    });
  });
});

// test d'intégration GET

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByText("Mes notes de frais"));

      jest.spyOn(mockStore, "bills");

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.resolve();
          },
        };
      });

      await new Promise(process.nextTick);
      const message = await screen.getByText("Restaurants et bars");
      expect(message).toBeTruthy();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
