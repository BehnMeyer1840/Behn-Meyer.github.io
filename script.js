document
    .getElementById("surveyForm")
    .addEventListener("submit", function(e){

        e.preventDefault();

        alert("ส่งแบบสอบถามเรียบร้อย");

    });

const surveyForm = document.getElementById("surveyForm");

const stakeholderRadios = document.querySelectorAll(
    'input[name="stakeholderType"]'
);

const otherRadio = document.getElementById("otherStakeholderOption");
const otherStakeholder = document.getElementById("otherStakeholder");

function updateOtherStakeholderField() {
    const isOtherSelected = otherRadio.checked;

    otherStakeholder.disabled = !isOtherSelected;
    otherStakeholder.required = isOtherSelected;
    otherStakeholder.setAttribute(
        "aria-disabled",
        String(!isOtherSelected)
    );

    if (isOtherSelected) {
        otherStakeholder.focus();
    } else {
        otherStakeholder.value = "";
    }
}

stakeholderRadios.forEach((radio) => {
    radio.addEventListener("change", updateOtherStakeholderField);
});

surveyForm.addEventListener("submit", function (event) {
    event.preventDefault();

    updateOtherStakeholderField();

    alert("ส่งแบบสอบถามเรียบร้อย");
});
