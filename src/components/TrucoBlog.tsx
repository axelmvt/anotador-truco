const TrucoBlog = () => {
  return (
    <article className="w-full max-w-4xl mx-auto px-4 py-8 text-white/90">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
        El Truco Argentino: Historia y Reglas del Juego de Cartas más Popular
      </h1>
      
      <div className="prose prose-invert max-w-none opacity-90">
        <p className="lead text-lg mb-6">
          El Truco es uno de los juegos de cartas más emblemáticos y populares de Argentina, Uruguay y Paraguay.
          Con una mezcla de estrategia, psicología y un poco de suerte, este juego tradicional ha sido parte de
          reuniones familiares y encuentros entre amigos por generaciones.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Historia del Truco</h2>
        <p>
          El Truco tiene sus orígenes en España, pero fue en el Río de la Plata donde evolucionó y se popularizó 
          hasta convertirse en el juego nacional. El truco argentino se juega con la baraja española y combina 
          elementos de estrategia, engaño y habilidad para leer al oponente.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Cómo se Juega el Truco</h2>
        <p>
          El Truco se juega tradicionalmente entre dos equipos de 2 jugadores cada uno. El objetivo es acumular 
          puntos mediante el enfrentamiento de cartas en manos (o rondas) de tres. El primer equipo en alcanzar 
          los 30 puntos es el ganador.
        </p>
        
        <h3 className="text-lg font-semibold mt-6 mb-3">Valor de las Cartas</h3>
        <p>
          En el Truco, las cartas tienen un valor específico que no coincide con su numeración. 
          El orden de importancia de mayor a menor es:
        </p>
        <ol className="list-decimal pl-6 my-4 space-y-1">
          <li>Ancho de espadas (1 de espadas)</li>
          <li>Ancho de bastos (1 de bastos)</li>
          <li>Siete de espadas</li>
          <li>Siete de oros</li>
          <li>Tres de cualquier palo</li>
          <li>Dos de cualquier palo</li>
          <li>Ancho falso (1 de copa o de oro)</li>
          <li>Rey de cualquier palo</li>
          <li>Caballo de cualquier palo</li>
          <li>Sota de cualquier palo</li>
          <li>Siete de copa o de basto</li>
          <li>Seis de cualquier palo</li>
          <li>Cinco de cualquier palo</li>
          <li>Cuatro de cualquier palo</li>
        </ol>
        
        <h3 className="text-lg font-semibold mt-6 mb-3">Cantos y Envites</h3>
        <p>
          Una de las características más distintivas del Truco son los "cantos" o "envites", que son apuestas 
          verbales que aumentan el valor de la mano en juego:
        </p>
        <ul className="list-disc pl-6 my-4 space-y-1">
          <li><strong>Truco:</strong> Vale 2 puntos, puede ser respondido con "quiero" o "no quiero", o aumentado a "retruco".</li>
          <li><strong>Retruco:</strong> Vale 3 puntos, puede ser respondido con "quiero" o "no quiero", o aumentado a "vale cuatro".</li>
          <li><strong>Vale cuatro:</strong> Vale 4 puntos, solo puede ser aceptado o rechazado.</li>
          <li><strong>Envido:</strong> Apuesta basada en la suma de dos cartas del mismo palo, vale 2 puntos.</li>
          <li><strong>Flor:</strong> Cuando un jugador tiene tres cartas del mismo palo, vale 3 puntos.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Por Qué Necesitas un Anotador de Truco</h2>
        <p>
          Con tantos puntos en juego y partidas que pueden alargarse, llevar la cuenta correctamente es esencial. 
          Un anotador digital como el nuestro te permite:
        </p>
        <ul className="list-disc pl-6 my-4 space-y-1">
          <li>Mantener un registro claro de los puntos de cada equipo</li>
          <li>Visualizar fácilmente quién está en "buenas" y quién en "malas"</li>
          <li>Evitar discusiones sobre el puntaje actual</li>
          <li>Concentrarte en el juego sin preocuparte por llevar la cuenta</li>
        </ul>
        
        <p className="mt-8">
          Nuestro anotador de Truco es una herramienta digital gratuita diseñada específicamente para 
          jugadores de Truco Argentino. Con una interfaz intuitiva y fácil de usar, podrás concentrarte 
          en lo importante: ¡disfrutar del juego y ganar la partida!
        </p>
      </div>
    </article>
  );
};

export default TrucoBlog; 