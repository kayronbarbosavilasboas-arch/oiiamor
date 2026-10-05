// ===============================================
// DATA EM QUE O NAMORO COMEÇOU
// ===============================================

// IMPORTANTE:
// No JavaScript os meses começam em 0.
//
// Janeiro = 0
// Fevereiro = 1
// Março = 2
// Abril = 3
// Maio = 4
// Junho = 5
// Julho = 6
// Agosto = 7
// Setembro = 8
//
// Portanto:
// new Date(2026, 8, 6)
// = 06 de setembro de 2026

const dataInicial = new Date(2026, 8, 6, 0, 0, 0);


// ===============================================
// PEGANDO OS ELEMENTOS DO HTML
// ===============================================

const elementoDias = document.getElementById("dias");
const elementoHoras = document.getElementById("horas");
const elementoMinutos = document.getElementById("minutos");
const elementoSegundos = document.getElementById("segundos");


// ===============================================
// FUNÇÃO DO CONTADOR
// ===============================================

function atualizarContador() {

    // Pega a data e hora atual
    const agora = new Date();


    // Calcula quanto tempo passou desde 06/09/2026
    const diferenca = agora.getTime() - dataInicial.getTime();


    // Caso a data inicial ainda não tenha chegado
    if (diferenca < 0) {

        elementoDias.textContent = "0";
        elementoHoras.textContent = "0";
        elementoMinutos.textContent = "0";
        elementoSegundos.textContent = "0";

        return;
    }


    // ===========================================
    // CONVERSÃO DO TEMPO
    // ===========================================

    const segundosTotais = Math.floor(diferenca / 1000);


    const dias = Math.floor(
        segundosTotais / 86400
    );


    const horas = Math.floor(
        (segundosTotais % 86400) / 3600
    );


    const minutos = Math.floor(
        (segundosTotais % 3600) / 60
    );


    const segundos =
        segundosTotais % 60;


    // ===========================================
    // MOSTRA OS VALORES NA TELA
    // ===========================================

    elementoDias.textContent = dias;

    elementoHoras.textContent =
        String(horas).padStart(2, "0");

    elementoMinutos.textContent =
        String(minutos).padStart(2, "0");

    elementoSegundos.textContent =
        String(segundos).padStart(2, "0");
}


// ===============================================
// INICIA O CONTADOR
// ===============================================

// Atualiza imediatamente quando abre a página
atualizarContador();


// Depois atualiza a cada 1 segundo
setInterval(atualizarContador, 1000);