const DISCOUNT_RATE = 0.15;
const MAX_DISCOUNT_CENTS = 100000;

const toCents = (pesos) => Math.round(pesos * 100);

const peso = (cents) => "₱" + (cents / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const $ = (id) => document.getElementById(id);
const form = $("rentalForm");

const numberFields = ["hours", "hourlyRate", "chairs", "chairRate", "cleaningFee", "payment"];
const textFields = ["renterName", "facilityName", "eventDate"];

function validate() {
  const problems = [];
  document.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));

  textFields.forEach((id) => {
    const el = $(id);
    if (!el.value.trim()) {
      el.classList.add("invalid");
      problems.push(el.closest("label").firstChild.textContent.trim());
    }
  });

  numberFields.forEach((id) => {
    const el = $(id);
    const label = el.closest("label").firstChild.textContent.trim();
    const value = el.value.trim();
    if (value === "" || isNaN(Number(value)) || Number(value) < 0) {
      el.classList.add("invalid");
      problems.push(label);
    }
  });

  if (Number.isFinite(Number($("chairs").value)) && $("chairs").value !== "" && !Number.isInteger(Number($("chairs").value))) {
    $("chairs").classList.add("invalid");
    problems.push("Chairs rented (whole number)");
  }
  return problems;
}

function calculate() {
  const hours = Number($("hours").value);
  const chairs = Number($("chairs").value);
  const eligible = form.eligibility.value === "Eligible";

  const facilityCents = Math.round(hours * toCents(Number($("hourlyRate").value)));
  const equipmentCents = chairs * toCents(Number($("chairRate").value));
  const discountCents = eligible ? Math.min(Math.round(facilityCents * DISCOUNT_RATE), MAX_DISCOUNT_CENTS) : 0;
  const netFacilityCents = facilityCents - discountCents;
  const cleaningCents = toCents(Number($("cleaningFee").value));
  const totalCents = netFacilityCents + equipmentCents + cleaningCents;
  const paymentCents = toCents(Number($("payment").value));

  let status, cls;
  if (paymentCents === 0) { status = "Unpaid"; cls = "unpaid"; }
  else if (paymentCents < totalCents) { status = "Partially Paid"; cls = "partial"; }
  else if (paymentCents === totalCents) { status = "Fully Paid"; cls = "full"; }
  else { status = "Excess Payment"; cls = "excess"; }

  const excess = paymentCents > totalCents;
  const balanceCents = excess ? paymentCents - totalCents : totalCents - paymentCents;

  return { facilityCents, equipmentCents, discountCents, netFacilityCents, cleaningCents,
           totalCents, paymentCents, balanceCents, excess, status, cls, eligible };
}

function formatDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function render(r) {
  $("outName").textContent = $("renterName").value.trim();
  $("outFacility").textContent = $("facilityName").value.trim();
  $("outDate").textContent = formatDate($("eventDate").value);
  $("outEligibility").textContent = r.eligible ? "Eligible" : "Not Eligible";

  $("outFacilityCharge").textContent = peso(r.facilityCents);
  $("outDiscount").textContent = r.discountCents ? "−" + peso(r.discountCents) : peso(0);
  $("outNetFacility").textContent = peso(r.netFacilityCents);
  $("outEquipment").textContent = peso(r.equipmentCents);
  $("outCleaning").textContent = peso(r.cleaningCents);
  $("outTotal").textContent = peso(r.totalCents);
  $("outPayment").textContent = peso(r.paymentCents);

  $("balanceLabel").textContent = r.excess ? "Excess payment to return" : "Unpaid balance";
  $("outBalance").textContent = peso(r.balanceCents);

  const stamp = $("stamp");
  stamp.textContent = r.status;
  stamp.className = "stamp " + r.cls;
  void stamp.offsetWidth;
  stamp.classList.add("pop");

  $("emptyState").hidden = true;
  $("result").hidden = false;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const error = $("error");
  const problems = validate();
  if (problems.length) {
    error.textContent = "Check these fields: " + problems.join(", ") + ". Numbers must be zero or higher.";
    error.hidden = false;
    return;
  }
  error.hidden = true;
  render(calculate());
});

form.addEventListener("reset", () => {
  $("error").hidden = true;
  document.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  $("result").hidden = true;
  $("emptyState").hidden = false;
});
