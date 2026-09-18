const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyMPG3MyGoNPn3SFWaScdjwbE-q4sXY-iZUpPeLoG4SXrz5K65SH_fjOKO1WMq46aTo/exec";
const REQUEST_TIMEOUT_MS = 15000;

const surveyForm = document.getElementById("surveyForm");

if (!surveyForm) {
    throw new Error("ไม่พบแบบฟอร์ม surveyForm");
}

const otherRadio = document.getElementById("otherStakeholderOption");
const otherStakeholder = document.getElementById("otherStakeholder");

function getToggleInputs() {
    return surveyForm.querySelectorAll(
        'input[type="radio"], input[type="checkbox"]'
    );
}

function syncSelectedState() {
    getToggleInputs().forEach((input) => {
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

function createSubmissionId() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createTimeoutSignal() {
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
        return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    }

    const controller = new AbortController();
    window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    return controller.signal;
}

function getLabelText(input) {
    const label = input.closest("label");

    if (!label) {
        return input.value;
    }

    const labelClone = label.cloneNode(true);

    labelClone.querySelectorAll("input").forEach((element) => {
        element.remove();
    });

    return labelClone.textContent.replace(/\s+/g, " ").trim();
}

function getSelectedInputs(name) {
    return Array.from(
        surveyForm.querySelectorAll(`input[name="${name}"]:checked`)
    );
}

function getSelectedCodes(name) {
    return getSelectedInputs(name)
        .map((input) => input.value)
        .join("; ");
}

function getSelectedTexts(name) {
    return getSelectedInputs(name)
        .map((input) => getLabelText(input))
        .filter(Boolean)
        .join("; ");
}

function getSelectedStakeholderCode() {
    const selectedInput = surveyForm.querySelector(
        'input[name="stakeholderType"]:checked'
    );

    return selectedInput ? selectedInput.value : "";
}

function getSelectedStakeholderText() {
    const selectedInput = surveyForm.querySelector(
        'input[name="stakeholderType"]:checked'
    );

    if (!selectedInput) {
        return "";
    }

    if (selectedInput.value === "Other") {
        return String(otherStakeholder?.value || "").trim();
    }

    return getLabelText(selectedInput);
}

function getPayload() {
    const formData = new FormData(surveyForm);

    return {
        submissionId: createSubmissionId(),
        organization: String(formData.get("organization") || "").trim(),
        contactName: String(formData.get("contactName") || "").trim(),
        surveyDate: String(formData.get("surveyDate") || "").trim(),

        // Code ใช้สำหรับตรวจสอบฝั่ง Apps Script
        stakeholderType: getSelectedStakeholderCode(),
        expectations: getSelectedCodes("expectations"),
        requirements: getSelectedCodes("requirements"),

        // Text ใช้สำหรับบันทึกข้อความที่ผู้ใช้เห็นใน Google Sheet
        stakeholderTypeText: getSelectedStakeholderText(),
        expectationsText: getSelectedTexts("expectations"),
        requirementsText: getSelectedTexts("requirements"),

        otherStakeholder: String(
            formData.get("otherStakeholder") || ""
        ).trim(),
        suggestion: String(formData.get("suggestion") || "").trim(),
        website: String(formData.get("website") || "").trim()
    };
}

getToggleInputs().forEach((input) => {
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

    if (!submitButton) {
        throw new Error("ไม่พบปุ่มส่งแบบสอบถาม");
    }

    submitButton.disabled = true;
    submitButton.textContent = "กำลังบันทึกข้อมูล...";

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(getPayload()),
            signal: createTimeoutSignal()
        });

        alert("ส่งแบบสอบถามเรียบร้อยแล้ว");
        surveyForm.reset();
        syncSelectedState();
        updateOtherFieldState();
    } catch (error) {
        console.error("ส่งข้อมูลไม่สำเร็จ:", error);

        if (error.name === "AbortError") {
            alert("การส่งข้อมูลใช้เวลานานเกินไป กรุณาตรวจสอบ Google Sheet ก่อนส่งซ้ำ");
        } else {
            alert("ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
        }
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "ส่งแบบสอบถาม";
    }
});

syncSelectedState();
updateOtherFieldState();
