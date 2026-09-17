const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzkM8QRes30RXHRh2PJAUyYFjIm8grYFotBcUk1_jIFauBd6TqKCV-PM9hMPlsVGfyU/exec";

const surveyForm = document.getElementById("surveyForm");

const toggleInputs = document.querySelectorAll(
    'input[type="radio"], input[type="checkbox"]'
);

const otherRadio = document.getElementById("otherStakeholderOption");
const otherStakeholder = document.getElementById("otherStakeholder");

function syncSelectedState() {
    toggleInputs.forEach((input) => {
        const container = input.closest(".option-item, .check-item");

        if (container) {
            container.classList.toggle("is-selected", input.checked);
        }
    });
}

function updateOtherFieldState() {
    if (!otherRadio || !otherStakeholder) return;

    const isOtherSelected = otherRadio.checked;

    otherStakeholder.disabled = !isOtherSelected;
    otherStakeholder.required = isOtherSelected;
    otherStakeholder.setAttribute(
        "aria-disabled",
        String(!isOtherSelected)
    );

    if (!isOtherSelected) {
        otherStakeholder.value = "";
    }
}

toggleInputs.forEach((input) => {
    input.addEventListener("change", () => {
        syncSelectedState();
        updateOtherFieldState();
    });
});

surveyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!surveyForm.checkValidity()) {
        surveyForm.reportValidity();
        return;
    }

    const submitButton = surveyForm.querySelector(".btn-submit");

    submitButton.disabled = true;
    submitButton.textContent = "กำลังบันทึกข้อมูล...";

    const formData = new FormData(surveyForm);

    const data = {
    organization: formData.get("organization") || "",
    contactName: formData.get("contactName") || "",
    surveyDate: formData.get("surveyDate") || "",

    stakeholderType: getSelectedStakeholderText(),

    otherStakeholder: formData.get("otherStakeholder") || "",

    expectations: getSelectedTextValues("expectations"),

    requirements: getSelectedTextValues("requirements"),

    suggestion: formData.get("suggestion") || "",

    consent: document.getElementById("consent").checked
};

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(data)
        });

        alert("บันทึกแบบสอบถามเรียบร้อยแล้ว");

        surveyForm.reset();
        syncSelectedState();
        updateOtherFieldState();

    } catch (error) {
        console.error("ส่งข้อมูลไม่สำเร็จ:", error);
        alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "ส่งแบบสอบถาม";
    }
});

syncSelectedState();
updateOtherFieldState();
