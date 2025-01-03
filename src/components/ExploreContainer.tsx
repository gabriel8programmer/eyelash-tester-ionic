import React, { useEffect, useRef, useState } from "react";
import { IonButton } from "@ionic/react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import {
  FaceMeshDetection,
  FaceMeshPoint,
  UseCase,
} from "@capacitor-mlkit/face-mesh-detection";

const ExploreContainer: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<FaceMeshPoint[] | undefined>();
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageRef.current) {
      const { width, height } = imageRef.current.getBoundingClientRect();
      setImageDimensions({ width, height });
    }
  }, [selectedImage]);

  // Função para salvar a imagem como um arquivo temporário
  const saveImageToFile = async (
    base64Image: string
  ): Promise<string | null> => {
    try {
      const fileName = `${new Date().getTime()}.jpg`; // Nome de arquivo único
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Image,
        directory: Directory.Data,
      });
      return savedFile.uri; // Retorna o caminho da imagem salva
    } catch (error: any) {
      console.error("Erro ao salvar a imagem:", error);
      alert(`Erro ao salvar a imagem: ${error.message}`);
      return null;
    }
  };

  // Função para processar a imagem e identificar os landmarks faciais
  const processImage = async (imagePath: string) => {
    try {
      const { faceMeshs } = await FaceMeshDetection.processImage({
        path: imagePath,
        useCase: UseCase.FaceMesh,
      });

      if (!faceMeshs) {
        alert("Nenhum rosto identificado!");
      }

      setLandmarks(faceMeshs[0].faceMeshPoints);
    } catch (error: any) {
      console.error("Erro ao processar a imagem:", error);
      alert(`Erro ao processar a imagem: ${error.message}`);
    }
  };

  // Função para tirar foto usando a câmera
  const handleTakePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64, // Usando Base64 para garantir a imagem
        source: CameraSource.Camera, // Acessa a câmera do dispositivo
        quality: 90,
      });

      const imageBase64 = photo.base64String;
      if (imageBase64) {
        const savedImagePath = await saveImageToFile(imageBase64);
        if (savedImagePath) {
          setSelectedImage(`data:image/jpeg;base64,${imageBase64}`); // Atualize a imagem com base64
          await processImage(savedImagePath); // Processa a imagem salva
        }
      }
    } catch (error: any) {
      console.error("Erro ao tirar foto:", error);
      alert(`Erro ao tirar foto: ${error.message}`);
    }
  };

  // Função para selecionar uma imagem da galeria
  const handleSelectFromGallery = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64, // Usando Base64 para garantir a imagem
        source: CameraSource.Photos, // Acessa a galeria do dispositivo
        quality: 90,
      });

      const imageBase64 = photo.base64String;

      if (!imageBase64) {
        alert("Nenhuma imagem selecionada.");
        return;
      }

      if (imageBase64) {
        const savedImagePath = await saveImageToFile(imageBase64);
        if (savedImagePath) {
          setSelectedImage(`data:image/jpeg;base64,${imageBase64}`); // Atualize a imagem com base64
          await processImage(savedImagePath); // Processa a imagem salva
        }
      }
    } catch (error: any) {
      console.error("Erro ao selecionar imagem da galeria:", error);
      alert(`Erro ao selecionar imagem da galeria: ${error.message}`);
    }
  };

  return (
    <div id="container">
      <strong>Testando provador de Cílios</strong>
      <div style={{ marginTop: "16px" }}>
        {/* Botão para tirar uma foto */}
        <IonButton onClick={handleTakePhoto}>Tirar Foto</IonButton>

        {/* Botão para selecionar uma imagem da galeria */}
        <IonButton
          onClick={handleSelectFromGallery}
          style={{ marginLeft: "8px" }}
        >
          Selecionar da Galeria
        </IonButton>
      </div>

      {/* Exibe a imagem selecionada */}
      {selectedImage && (
        <div
          style={{
            marginTop: "16px",
            position: "relative",
            height: "350px",
            width: "100%",
          }}
        >
          <img
            ref={imageRef}
            src={selectedImage}
            alt="Selected image"
            style={{
              display: "block",
              width: "100%",
              height: "auto",
            }}
          />

          <div style={{ margin: "2rem 0" }}>
            {imageDimensions.width} x {imageDimensions.height}
          </div>

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            {/* Renderizar os pontos da malha facial */}
            {landmarks &&
              landmarks.length &&
              landmarks.map((face: FaceMeshPoint) => (
                <div
                  key={face.index}
                  style={{
                    position: "absolute",
                    top: `${face.point.y}px`,
                    left: `${face.point.x}px`,
                    backgroundColor: "red",
                    width: "2px",
                    height: "2px",
                    borderRadius: "100%",
                    // display: "grid",
                    // placeItems: "center",
                    // color: "black",
                    // fontSize: "10px",
                  }}
                >
                  {/* <p>
                    <strong>{`#${face.index}`}</strong> -
                    {` ${face.point.x.toFixed(1)} x ${face.point.y.toFixed(1)}`}
                  </p> */}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreContainer;
