document
    .getElementById("surveyForm")
    .addEventListener("submit", function(e){

        e.preventDefault();

        alert("ส่งแบบสอบถามเรียบร้อย");

    });

// Make "อื่น ๆ โปรดระบุ" look like a single radio option with an inline text field.
const otherStakeholder = document.getElementById("otherStakeholder");
const otherStakeholderGroup = otherStakeholder?.closest(".form-group");

if (otherStakeholder && otherStakeholderGroup) {
    const otherLabel = document.createElement("label");
    const otherRadio = document.createElement("input");

    otherLabel.className = "option-item other-option";
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

    const stakeholderRadios = document.querySelectorAll('input[name="stakeholderType"]');

    stakeholderRadios.forEach((radio) => {
        radio.addEventListener("change", () => {
            const isOtherSelected = otherRadio.checked;

            otherStakeholder.disabled = !isOtherSelected;
            otherStakeholder.required = isOtherSelected;
            otherStakeholder.setAttribute("aria-disabled", String(!isOtherSelected));

            if (isOtherSelected) {
                otherStakeholder.focus();
            } else {
                otherStakeholder.value = "";
            }
        });
    });
}
