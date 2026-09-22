const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzrcxLJ6TTTXbidPe8Pb96Woxbcv3MtksB9M-6txyFRgaWvXU6UdUr2daQgqmbMlRnw/exec";

const REQUEST_TIMEOUT_MS = 15000;
const form = document.getElementById("surveyForm");
const status = document.getElementById("formStatus");
const submitButton = form?.querySelector(".btn-submit");

const otherRadio = document.getElementById("otherStakeholderOption");
const otherInput = document.getElementById("otherStakeholder");
const otherClimateActionCheckbox = document.getElementById("otherClimateActionCheckbox");
const otherClimateActionInput = document.getElementById("otherClimateAction");

if (!form) throw new Error("ไม่พบแบบฟอร์ม surveyForm");

function selectedInputs(name) {
    return [...form.querySelectorAll(`input[name="${name}"]:checked`)];
}

function selectedCodes(name) {
    return selectedInputs(name).map(input => input.value).join(";");
}

function labelText(input) {
    const label = input.closest("label");
    if (!label) return input.value;
    const clone = label.cloneNode(true);
    clone.querySelectorAll("input").forEach(element => element.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
}

function selectedText(name) {
    return selectedInputs(name)
        .map(labelText)
        .filter(Boolean)
        .join(" | ");
}

function selectedClimateActionsText(data) {
    const selectedOptions = selectedInputs("climateActions")
        .filter(input => input.value !== "Other")
        .map(labelText)
        .filter(Boolean);

    const otherText = String(data.get("climateActionsOther") || "").trim();
    if (otherText) selectedOptions.push(otherText);

    return selectedOptions.join(" | ");
}

function submissionId() {
    return crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function syncSelectedState() {
    form.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.closest(".option-item, .check-item")?.classList.toggle("is-selected", input.checked);
    });
}

function syncOtherField() {
    const stakeholderActive = Boolean(otherRadio?.checked);
    if (otherInput) {
        otherInput.disabled = !stakeholderActive;
        otherInput.required = stakeholderActive;
        if (!stakeholderActive) otherInput.value = "";
    }

    const climateActive = Boolean(otherClimateActionCheckbox?.checked);
    if (otherClimateActionInput) {
        otherClimateActionInput.disabled = !climateActive;
        otherClimateActionInput.required = climateActive;
        if (!climateActive) otherClimateActionInput.value = "";
    }
}

function setStatus(message, type = "") {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status ${type}`;
}

function timeoutSignal() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function payload() {
    const data = new FormData(form);
    const stakeholder = form.querySelector('input[name="stakeholderType"]:checked');
    const stakeholderText = stakeholder
        ? (stakeholder.value === "Other"
            ? String(data.get("otherStakeholder") || "").trim()
            : labelText(stakeholder))
        : "";

    return {
        submissionId: submissionId(),
        website: String(data.get("website") || ""),
        organization: String(data.get("organization") || "").trim(),
        contactName: String(data.get("contactName") || "").trim(),
        surveyDate: String(data.get("surveyDate") || ""),
        stakeholderType: stakeholder?.value || "",
        expectations: selectedCodes("expectations"),
        requirements: selectedCodes("requirements"),
        climateActions: selectedCodes("climateActions"),
        climateActionsOther: String(data.get("climateActionsOther") || "").trim(),
        stakeholderTypeText: stakeholderText,
        otherStakeholder: String(data.get("otherStakeholder") || "").trim(),
        expectationsText: selectedText("expectations"),
        requirementsText: selectedText("requirements"),
        climateActionsText: selectedClimateActionsText(data),
        suggestion: String(data.get("suggestion") || "").trim()
    };
}

form.addEventListener("change", () => {
    syncSelectedState();
    syncOtherField();
});

form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    submitButton.disabled = true;
    setStatus("กำลังบันทึกข้อมูล...", "");
    const request = timeoutSignal();

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(payload()),
            signal: request.signal
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.message || "ไม่สามารถบันทึกข้อมูลได้");

        setStatus(result.message || "บันทึกข้อมูลเรียบร้อยแล้ว", "success");
        window.location.href = "index2.html";
    } catch (error) {
        setStatus(
            error.name === "AbortError"
                ? "หมดเวลาการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง"
                : (error.message || "ไม่สามารถส่งข้อมูลได้"),
            "error"
        );
    } finally {
        request.clear();
        submitButton.disabled = false;
    }
});

syncSelectedState();
syncOtherField();
