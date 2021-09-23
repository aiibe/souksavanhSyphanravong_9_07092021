import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import firebase from "../__mocks__/firebase";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Router from "../app/Router";
import firestore from "../app/Firestore";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      jest.mock("../app/Firestore");
      firestore.bills = () => ({
        get: jest.fn().mockResolvedValue(),
      });

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/",
          hash: "#employee/bills",
        },
      });

      document.body.innerHTML = `<div id="root"></div>`;
      Router();

      expect(
        screen.getByTestId("icon-window").classList.contains("active-icon")
      ).toBeTruthy();
      expect(
        screen.getByTestId("icon-mail").classList.contains("active-icon")
      ).not.toBeTruthy();
    });

    describe("And data has been fetched with success", () => {
      test("Then bills should be ordered from earliest to latest", () => {
        const html = BillsUI({ data: bills });
        document.body.innerHTML = html;
        const dates = screen
          .getAllByText(
            /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
          )
          .map((a) => a.innerHTML);
        const antiChrono = (a, b) => (a < b ? 1 : -1);
        const datesSorted = [...dates].sort(antiChrono);
        expect(dates).toEqual(datesSorted);
      });
    });

    describe("And while data is loading", () => {
      test("Then Loading page should appears", () => {
        const html = BillsUI({ data: [], loading: true });
        document.body.innerHTML = html;
        const isLoading = screen.getAllByText("Loading...");
        expect(isLoading).toBeTruthy();
      });
    });

    describe("And failed to fetch data", () => {
      test("Then Error page should appears", () => {
        const html = BillsUI({ data: [], error: true });
        document.body.innerHTML = html;
        const hasError = screen.getAllByText("Erreur");
        expect(hasError).toBeTruthy();
      });
    });

    describe("And I click on new bill button", () => {
      test("Then its handler should be called", () => {
        const html = BillsUI({ data: [] });
        document.body.innerHTML = html;

        const billsContainer = new Bills({
          document,
          onNavigate: () => ROUTES_PATH["NewBill"],
          localStorage: null,
          firestore: null,
        });

        const clickNewBill = jest.fn(billsContainer.handleClickNewBill);
        const newBillButton = screen.getByTestId("btn-new-bill");
        newBillButton.addEventListener("click", clickNewBill);
        userEvent.click(newBillButton);

        expect(clickNewBill).toHaveBeenCalled();
      });
    });

    describe("And I click on first eye icon", () => {
      test("Then modal should open", () => {
        const html = BillsUI({ data: bills });
        document.body.innerHTML = html;

        const billsContainer = new Bills({
          document,
          onNavigate: () => ROUTES_PATH["NewBill"],
          localStorage: null,
          firestore: null,
        });

        $.fn.modal = jest.fn();
        const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
        const clickIconEye = jest.fn(
          billsContainer.handleClickIconEye(firstEyeIcon)
        );
        firstEyeIcon.addEventListener("click", clickIconEye);
        userEvent.click(firstEyeIcon);

        expect($.fn.modal).toHaveBeenCalled();
        expect(clickIconEye).toHaveBeenCalled();
      });
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");
      const bills = await firebase.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
