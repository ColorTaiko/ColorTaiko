import PropTypes from "prop-types";

const ErrorModal = ({ message, onClose, titleFont }) => {
  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      color: 'black',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        maxWidth: '60%',
        width: '400px',
        textAlign: 'center',
      }}>
        <h2 style={{ color: 'red', marginTop: 0, fontSize: '24px' }}>Hint:</h2>
        <p style={{ fontSize: '18px', marginBottom: '30px' }} dangerouslySetInnerHTML={{__html: message}}></p>
        <button onClick={onClose} style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          fontFamily: titleFont || 'inherit',
          fontWeight: 'bold',
        }}>Close</button>
      </div>
    </div>
  );
};
ErrorModal.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  titleFont: PropTypes.string,
};

export default ErrorModal;