document
    .getElementById("surveyForm")
    .addEventListener("submit", function(e){

        e.preventDefault();

        alert("ส่งแบบสอบถามเรียบร้อย");

    });

// Make the "อื่น ๆ โปรดระบุ" field a single-select stakeholder option.
const otherStakeholder = document.getElementById("otherStakeholder");
const otherStakeholderGroup = otherStakeholder?.closest(".form-group");

if (otherStakeholder && otherStakeholderGroup) {
    const otherOption = document.createElement("label");
    const otherRadio = document.createElement("input");

    otherOption.className = "option-item other-option";
    otherRadio.type = "radio";
    otherRadio.name = "stakeholderType";
    otherRadio.value = "Other";
    otherRadio.id = "otherStakeholderOption";
    otherRadio.setAttribute("aria-controls", "otherStakeholder");

    otherOption.append(otherRadio, document.createTextNode("อื่น ๆ โปรดระบุ"));
    otherStakeholderGroup.parentNode.insertBefore(otherOption, otherStakeholderGroup);

    otherStakeholder.disabled = true;
    otherStakeholder.setAttribute("aria-disabled", "true");

    const stakeholderRadios = document.querySelectorAll('input[name="stakeholderType"]');

    stakeholderRadios.forEach((radio) => {
        radio.addEventListener("change", () => {
            const isOtherSelected = otherRadio.checked;

            otherStakeholder.disabled = !isOtherSelected;
            otherStakeholder.required = isOtherSelected;
            otherStakeholder.setAttribute("aria-disabled", String(!isOtherSelected));

            if (!isOtherSelected) {
                otherStakeholder.value = "";
            }
        });
    });
}
