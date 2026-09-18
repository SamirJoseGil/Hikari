export const meta = () => {
  return [
    { title: "Titulo de la pagina" },
    { name: "description", content: "Contenido" },
  ];
};

export default function Index() {
  return (
    <div>
      <h1>Bienvenido a la página principal</h1>
      <p>Esta es la página principal de nuestra aplicación.</p>
    </div>
  );
}