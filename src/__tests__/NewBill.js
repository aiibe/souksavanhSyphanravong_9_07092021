import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage";
import firestore from "../app/Firestore.js";

describe("Given I am connected as an Employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I should see a form with 8 fields and a send button", () => {
      document.body.innerHTML = NewBillUI();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByRole("button")).toBeTruthy();
    });

    describe("And I upload an image", () => {
      test("Then handleChangeFile should be called with one file uploaded", () => {
        document.body.innerHTML = NewBillUI();

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        const newBill = new NewBill({
          document,
          onNavigate: () => {},
          firestore,
          localStorage: window.localStorage,
        });

        const changeFile = jest.fn(newBill.handleChangeFile);
        const fileInput = screen.getByTestId("file");
        fileInput.addEventListener("change", changeFile);
        userEvent.upload(
          fileInput,
          new File(["hello"], "hello.png", { type: "image/png" })
        );

        expect(changeFile).toHaveBeenCalled();
        expect(fileInput.files.length).toBe(1);
        expect(fileInput.files[0].name).toBe("hello.png");
      });
    });

    // test d'integration
    describe("And I submit the form with valid data", () => {
      test("Then my bill should be created", () => {
        document.body.innerHTML = NewBillUI();

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "johndoe@email.com",
          })
        );

        const newBill = new NewBill({
          document,
          onNavigate: () => {},
          firestore,
          localStorage: window.localStorage,
        });

        const submitBill = jest.fn(newBill.handleSubmit);
        newBill.createBill = jest.fn();

        screen.getByTestId("expense-type").value = "Equipement et matériel";
        screen.getByTestId("expense-name").value = "Souris Logitech";
        screen.getByTestId("datepicker").value = "2021-09-17";
        screen.getByTestId("amount").value = 1;
        screen.getByTestId("vat").value = 70;
        screen.getByTestId("pct").value = 20;
        screen.getByTestId("commentary").value = "Remplacement";
        userEvent.upload(
          screen.getByTestId("file"),
          new File(["hello"], "hello.png", { type: "image/png" })
        );

        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", submitBill);

        userEvent.click(screen.getByRole("button"));

        expect(submitBill).toHaveBeenCalled();
        expect(newBill.createBill).toHaveBeenCalled();
      });
    });
  });
});
