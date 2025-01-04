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
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(
    null
  );
  const [landmarks, setLandmarks] = useState<FaceMeshPoint[] | undefined>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Ajustar o tamanho do canvas à tela
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      // Limpar o canvas antes de redesenhar
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Desenhar a imagem no canvas
      const scale = Math.min(
        canvas.width / selectedImage.naturalWidth,
        canvas.height / selectedImage.naturalHeight
      );

      const xOffset = (canvas.width - selectedImage.naturalWidth * scale) / 2;
      const yOffset = (canvas.height - selectedImage.naturalHeight * scale) / 2;

      ctx.drawImage(
        selectedImage,
        xOffset,
        yOffset,
        selectedImage.naturalWidth * scale,
        selectedImage.naturalHeight * scale
      );

      // Desenhar os pontos faciais
      if (landmarks) {
        ctx.fillStyle = "red";
        landmarks.forEach((point) => {
          ctx.beginPath();
          ctx.arc(
            xOffset + point.point.x * scale,
            yOffset + point.point.y * scale,
            2,
            0,
            2 * Math.PI
          );
          ctx.fill();
        });
      }
    }
  }, [selectedImage, landmarks]);

  const saveImageToFile = async (
    base64Image: string
  ): Promise<string | null> => {
    try {
      const fileName = `${new Date().getTime()}.jpg`;
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Image,
        directory: Directory.Data,
      });
      return savedFile.uri;
    } catch (error: any) {
      console.error("Erro ao salvar a imagem:", error);
      alert(`Erro ao salvar a imagem: ${error.message}`);
      return null;
    }
  };

  const processImage = async (imagePath: string) => {
    try {
      const { faceMeshs } = await FaceMeshDetection.processImage({
        path: imagePath,
        useCase: UseCase.FaceMesh,
      });
      if (!faceMeshs) {
        alert("Nenhum rosto identificado!");
        return;
      }
      setLandmarks(faceMeshs[0].faceMeshPoints);
    } catch (error: any) {
      console.error("Erro ao processar a imagem:", error);
      alert(`Erro ao processar a imagem: ${error.message}`);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        quality: 90,
      });
      const imageBase64 = photo.base64String;
      if (imageBase64) {
        const savedImagePath = await saveImageToFile(imageBase64);
        if (savedImagePath) {
          const img = new Image();
          img.src = `data:image/jpeg;base64,${imageBase64}`;
          img.onload = () => setSelectedImage(img);
          await processImage(savedImagePath);
        }
      }
    } catch (error: any) {
      console.error("Erro ao tirar foto:", error);
      alert(`Erro ao tirar foto: ${error.message}`);
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        quality: 90,
      });
      const imageBase64 = photo.base64String;
      if (!imageBase64) {
        alert("Nenhuma imagem selecionada.");
        return;
      }
      const savedImagePath = await saveImageToFile(imageBase64);
      if (savedImagePath) {
        const img = new Image();
        img.src = `data:image/jpeg;base64,${imageBase64}`;
        img.onload = () => setSelectedImage(img);
        await processImage(savedImagePath);
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
        <IonButton onClick={handleTakePhoto}>Tirar Foto</IonButton>
        <IonButton
          onClick={handleSelectFromGallery}
          style={{ marginLeft: "8px" }}
        >
          Selecionar da Galeria
        </IonButton>
      </div>
      <div
        style={{
          marginTop: "16px",
          position: "relative",
          width: "100%",
          height: "400px",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        ></canvas>
      </div>
    </div>
  );
};

export default ExploreContainer;
