const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzkM8QRes30RXHRh2PJAUyYFjIm8grYFotBcUk1_jIFauBd6TqKCV-PM9hMPlsVGfyU/exec";

const surveyForm = document.getElementById("surveyForm");

// ไม่ต้องแสดงส่วนยืนยันความยินยอม
const consentCard = document.querySelector(".consent-card");
if (consentCard) {
    consentCard.remove();
}

const otherStakeholder = document.getElementById("otherStakeholder");
const otherStakeholderGroup = otherStakeholder?.closest(".form-group");

let otherRadio = document.getElementById("otherStakeholderOption");

/*
 * สร้างตัวเลือก Other แบบ Radio + Text field
 * สำหรับกรณีที่ index.html ยังมี Other เป็นช่อง text แยกอยู่
 */
if (otherStakeholder && otherStakeholderGroup && !otherRadio) {
    const otherLabel = document.createElement("label");

    otherLabel.className = "option-item other-option";

    otherRadio = document.createElement("input");
    otherRadio.type = "radio";
    otherRadio.name = "stakeholderType";
    otherRadio.value = "Other";
    otherRadio.id = "otherStakeholderOption";
    otherRadio.setAttribute("aria-controls", "otherStakeholder");

    otherStakeholder.placeholder = "Other";
    otherStakeholder.disabled = true;
    otherStakeholder.setAttribute("aria-disabled", "true");

    otherLabel.append(otherRadio, otherStakeholder);
    otherStakeholderGroup.replaceWith(otherLabel);
}

/*
 * เพิ่ม class ให้ตัวเลือกทุกข้อ
 * เพื่อให้ CSS Highlight ทำงานได้
 */
function prepareOptionContainers() {
    const inputs = surveyForm.querySelectorAll(
        'input[type="radio"], input[type="checkbox"]'
    );

    inputs.forEach((input) => {
        const label = input.closest("label");

        if (!label) return;

        if (input.type === "radio") {
            label.classList.add("option-item");
        }

        if (input.type === "checkbox") {
            label.classList.add("check-item");
        }
    });
}

/*
 * Highlight ตัวเลือกที่ถูกเลือก
 */
function syncSelectedState() {
    const inputs = surveyForm.querySelectorAll(
        'input[type="radio"], input[type="checkbox"]'
    );

    inputs.forEach((input) => {
        const container = input.closest("label");

        if (container) {
            container.classList.toggle("is-selected", input.checked);
        }
    });
}

/*
 * เปิด/ปิดช่อง Other
 */
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

/*
 * ดึงข้อความภาษาไทยจาก label
 */
function getLabelText(input) {
    const label = input.closest("label");

    if (!label) {
        return input.value;
    }

    const labelClone = label.cloneNode(true);
    const inputElements = labelClone.querySelectorAll("input");

    inputElements.forEach((element) => {
        element.remove();
    });

    return labelClone.textContent.replace(/\s+/g, " ").trim();
}

/*
 * ดึงข้อความของ Checkbox ที่เลือกหลายข้อ
 */
function getSelectedTextValues(name) {
    const selectedInputs = surveyForm.querySelectorAll(
        `input[name="${name}"]:checked`
    );

    return Array.from(selectedInputs)
        .map((input) => getLabelText(input))
        .join("; ");
}

/*
 * ดึงข้อความของ Radio ประเภทผู้มีส่วนได้ส่วนเสีย
 */
function getSelectedStakeholderText() {
    const selectedInput = surveyForm.querySelector(
        'input[name="stakeholderType"]:checked'
    );

    if (!selectedInput) {
        return "";
    }

    if (selectedInput.value === "Other") {
        return otherStakeholder.value.trim() || "Other";
    }

    return getLabelText(selectedInput);
}

prepareOptionContainers();
syncSelectedState();
updateOtherFieldState();

const toggleInputs = surveyForm.querySelectorAll(
    'input[type="radio"], input[type="checkbox"]'
);

toggleInputs.forEach((input) => {
    input.addEventListener("change", () => {
        syncSelectedState();
        updateOtherFieldState();
    });
});

surveyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    updateOtherFieldState();

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
        suggestion: formData.get("suggestion") || ""
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
