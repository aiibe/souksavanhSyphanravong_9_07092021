import { screen } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    describe("Data is ready", () => {
      test("Then bill icon in vertical layout should be highlighted", () => {
        const html = BillsUI({ data: [] });
        document.body.innerHTML = html;
        //to-do write expect expression
      });
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

    describe("Waiting for data", () => {
      test("Then Loading page should appears", () => {
        const html = BillsUI({ data: [], loading: true });
        document.body.innerHTML = html;
        const isLoading = screen.getAllByText("Loading...");
        expect(isLoading).toBeTruthy();
      });
    });

    describe("Got an error fetching data", () => {
      test("Then Error page should appears", () => {
        const html = BillsUI({ data: [], error: true });
        document.body.innerHTML = html;
        const hasError = screen.getAllByText("Erreur");
        expect(hasError).toBeTruthy();
      });
    });
  });
});
