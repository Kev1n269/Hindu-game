const {createApp,  ref, component, onMounted, computed, nextTick} = Vue;

const sokcet=io("http://localhost:8080")

const app = createApp({
    setup(){

      function iniciarJogo() {
  alert("Jogo iniciado");
}
onMounted(()=>{

/*document.getElementById("expedicao").addEventListener("click", function() {
  alert("Você iniciou uma expedição!!!");
});*/

});

        return {iniciarJogo}
    }
});

//exemplo de componente
/*app.component('menu-de-recursos', {
  props: {
    madeira: {
      type: Int, 
      required: true 
    }, 
    pedra: {
      type: Int, 
      required: true 
    }
  }, 
  setup(props){
   const resource_sum=computed(()=>props.madeira+props.pedra);   
   return {resource_sum}
  }, 
  template: `
   <p> ((madeira)) + ((pedra)) = ((resource_sum)) </p> 
  ` 
});*/

app.config.compilerOptions.delimiters = ['((', '))'];
app.mount('#app'); 