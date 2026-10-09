function abrirModal(identificadorModal) {
    const modalObjetivo = document.getElementById(identificadorModal);
    if (modalObjetivo) {
        modalObjetivo.classList.add("modal-visible");
        document.body.style.overflow = "hidden";
    }
}


function cerrarModal(identificadorModal) {
    const modalObjetivo = document.getElementById(identificadorModal);
    if (modalObjetivo) {
        modalObjetivo.classList.remove("modal-visible");
        document.body.style.overflow = "auto";
    }
}


document.addEventListener("click", (evento) => {
    if (evento.target.classList.contains("capa-modal-fondo")) {
        evento.target.classList.remove("modal-visible");
        document.body.style.overflow = "auto";
    }
});