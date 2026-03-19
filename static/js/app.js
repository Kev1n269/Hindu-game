const {createApp,  ref, component, onMounted, computed, nextTick} = Vue;

const sokcet=io("http://localhost:8080")

const app = createApp({
    setup(){

      function iniciarJogo() {
  alert("Jogo iniciado");
}
onMounted(()=>{

document.getElementById("expedicao").addEventListener("click", function() {
  alert("Você iniciou uma expedição!!!");
});
});

        return {iniciarJogo}
    }
});


app.config.compilerOptions.delimiters = ['((', '))'];
app.mount('#app'); 