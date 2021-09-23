import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import BillsUI from "../views/BillsUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage";
import firebase from "../__mocks__/firebase.js";
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

    describe("And I upload an image in file input", () => {
      test("Then file input should contain exactly 1 file", () => {
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

    describe("And I click send button", () => {
      test("Then the form submit handler should be invoked", () => {
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

        const onSubmit = jest.fn(newBill.handleSubmit);
        newBill.createBill = jest.fn();

        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", onSubmit);

        userEvent.click(screen.getByRole("button"));

        expect(onSubmit).toHaveBeenCalled();
      });
    });

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

        newBill.createBill = jest.fn();

        const validBill = {
          type: "Equipement et matériel",
          name: "Souris Logitech",
          date: "2021-09-17",
          amount: 1,
          vat: 70,
          pct: 20,
          commentary: "Remplacement",
          fileUrl: "https://fisheye-six.vercel.app/assets/logo.png",
          fileName: "logo.png",
        };

        screen.getByTestId("expense-type").value = validBill.type;
        screen.getByTestId("expense-name").value = validBill.name;
        screen.getByTestId("datepicker").value = validBill.date;
        screen.getByTestId("amount").value = validBill.amount;
        screen.getByTestId("vat").value = validBill.vat;
        screen.getByTestId("pct").value = validBill.pct;
        screen.getByTestId("commentary").value = validBill.commentary;
        newBill.fileName = validBill.fileName;
        newBill.fileUrl = validBill.fileUrl;

        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", newBill.handleSubmit);

        userEvent.click(screen.getByRole("button"));

        expect(newBill.createBill).toHaveBeenCalledWith({
          ...validBill,
          status: "pending",
        });
      });
    });

    // test d'integration POST
    test("Post bill from API with success", async () => {
      const postBill = jest.spyOn(firebase, "post");
      const validBill = {
        type: "Equipement et matériel",
        name: "Souris Logitech",
        date: "2021-09-17",
        amount: 1,
        vat: 70,
        pct: 20,
        commentary: "Remplacement",
        fileUrl: "https://fisheye-six.vercel.app/assets/logo.png",
        fileName: "logo.png",
        email: "johndoe@email.com",
        status: "pending",
      };

      const bills = await firebase.post(validBill);

      expect(postBill).toBeCalled();
      expect(bills.data.length).toBe(5);
    });

    test("Post bill from an API and fails with 404 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("Post bill from an API and fails with 500 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
