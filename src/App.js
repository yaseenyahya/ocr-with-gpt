import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

function App() {
  const [image, setImage] = useState(null);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const onDrop = (acceptedFiles) => {
    setImage(acceptedFiles[0]);
  };

  const handleSubmit = async () => {
    if (!image) {
      alert("Image is required.")
      return;
    }


    const formData = new FormData();
    formData.append('image', image);
    setLoading(true);
    setOutput("")
    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setOutput(response.data.response);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="App" style={{ margin: 20 }}>
      <h1 style={{ color: "red" }}>OCR PROJECT</h1>
      <div {...getRootProps()} style={{ border: '2px dashed #000', padding: '20px', cursor: 'pointer' }}>
        <input {...getInputProps()} />
        {image ? <p>{image.name}</p> : <p>Drag 'n' drop some file here, or click to select file</p>}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button style={{
          padding: 10,
          fontSize: 20,
          marginTop: 10,
          color: "white",
          background: "green",
          border: 0,
          cursor: "pointer"
        }}
          onClick={handleSubmit}>Submit</button>
      </div>
      {loading ? (
        <div style={{ marginTop: 20 }}>
          <h2>Loading...</h2>
        </div>
      ) :
        <div style={{ display: "flex", marginTop: 20 }}>

          {output &&
            <div>
              <h2 style={{ textDecoration: "overline" }}>OUTPUT</h2>
              <p style={{whiteSpace:"pre-wrap"}}>{output}</p>
            </div>}
          {image && (
            <div style={{ padding: 20 }}>
              <h2>Image Preview:</h2>
              <img
                src={URL.createObjectURL(image)}
                alt="Preview"
                style={{ height: 500 }}
              />
            </div>
          )}
        </div>
      }
    </div>
  );
}

export default App;
