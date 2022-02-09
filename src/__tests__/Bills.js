/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
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

// 3 tests?
// test unitaire: click newbild =>envoie sur la page newbild
// test unitaire: click oeil =>affiche la bild
// test intégration: getBills =>renvoie la liste des bills
