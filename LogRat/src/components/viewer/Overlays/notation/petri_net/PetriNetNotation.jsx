export const PetriNetNotation = () => {
  // You can customize the drawComponent, name, and description as needed
  const elements = [
    {
      drawComponent: <div>Place</div>,
      name: 'Place',
      description: 'Represents a place in the net'
    },
    {
      drawComponent: <div>Transition</div>,
      name: 'Transition',
      description: 'Represents a transition'
    }
    // Add more elements here
  ];

  return (
    <div className="legend-section">
      <div className="legend-section-title">
        <strong>Petri Net Notation</strong>
      </div>
      {/* {elements.map((element, index) => (
          <PetriNetElement key={index} {...element} />
        ))} */}
    </div>
  );
};
