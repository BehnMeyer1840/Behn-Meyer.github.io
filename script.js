const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzkM8QRes30RXHRh2PJAUyYFjIm8grYFotBcUk1_jIFauBd6TqKCV-PM9hMPlsVGfyU/exec";

const surveyForm = document.getElementById("surveyForm");
const toggleInputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
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
    otherStakeholder.setAttribute("aria-disabled", String(!isOtherSelected));

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

if (surveyForm) {
    surveyForm.addEventListener("submit", (event) => {
        event.preventDefault();
        syncSelectedState();
        updateOtherFieldState();
        alert("ส่งแบบสอบถามเรียบร้อย");
    });
}

syncSelectedState();
updateOtherFieldState();
