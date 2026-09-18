const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzwUDKSs8vIv8C42PLTMid9Le0ngWZb2ymh5qPawiD9rTL4JBuVXZh8QMCPuU4yRnbf/exec";
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

function getPayload() {
    const formData = new FormData(surveyForm);

    return {
        submissionId: createSubmissionId(),
        organization: String(formData.get("organization") || "").trim(),
        contactName: String(formData.get("contactName") || "").trim(),
        surveyDate: String(formData.get("surveyDate") || "").trim(),
        stakeholderType: String(
            formData.get("stakeholderType") || ""
        ).trim(),
        otherStakeholder: String(
            formData.get("otherStakeholder") || ""
        ).trim(),
        expectations: formData.getAll("expectations").join("; "),
        requirements: formData.getAll("requirements").join("; "),
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
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(getPayload()),
            signal: createTimeoutSignal()
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        let result;

        try {
            result = await response.json();
        } catch (error) {
            throw new Error("Response is not valid JSON");
        }

        if (!result || result.success !== true) {
            throw new Error(result?.message || "บันทึกข้อมูลไม่สำเร็จ");
        }

        alert("บันทึกแบบสอบถามเรียบร้อยแล้ว");

        surveyForm.reset();
        syncSelectedState();
        updateOtherFieldState();
    } catch (error) {
        console.error("ส่งข้อมูลไม่สำเร็จ:", error);

        const message =
            error.name === "AbortError"
                ? "การส่งข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง"
                : "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง";

        alert(message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "ส่งแบบสอบถาม";
    }
});

syncSelectedState();
updateOtherFieldState();
