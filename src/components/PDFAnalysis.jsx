import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Spinner, Button, Alert, Accordion } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faCheckCircle, faQuestionCircle, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const API_KEY = 'AIzaSyCZDjft84YFmxTw3f1enki5L2OvvfN5INg';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const PDFAnalysis = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pdfContent, setPdfContent] = useState('');
    const [question, setQuestion] = useState('');
    const [answers, setAnswers] = useState([]);
    const [activeKey, setActiveKey] = useState('0');

    const extractTextFromPDF = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + ' ';
        }
        
        return fullText;
    };

    const handleFileUpload = async (event) => {
        const uploadedFile = event.target.files[0];
        if (uploadedFile && uploadedFile.type === 'application/pdf') {
            setFile(uploadedFile);
            setLoading(true);
            try {
                const text = await extractTextFromPDF(uploadedFile);
                setPdfContent(text);
            } catch (error) {
                console.error('Error al procesar el PDF:', error);
                alert('Error al procesar el PDF. Por favor, intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        } else {
            alert('Por favor, sube un archivo PDF válido');
        }
    };

    const handleQuestionSubmit = async (e) => {
        e.preventDefault();
        if (!pdfContent) {
            alert('Por favor, sube un PDF primero');
            return;
        }
        
        setLoading(true);
        try {
            const prompt = `Analiza el siguiente contenido del PDF y responde a la pregunta de manera detallada y bien estructurada.

Contexto del PDF:
${pdfContent}

Pregunta: ${question}

Por favor, proporciona una respuesta:
1. Bien organizada con títulos y subtítulos usando formato markdown (** para negrita)
2. Con saltos de línea entre secciones para mejor legibilidad
3. Incluyendo todos los detalles relevantes encontrados en el PDF
4. Si hay cifras o datos importantes, preséntalo en formato de lista
5. Si es posible, agrupa la información por categorías

Formato deseado:
**Título Principal**
Descripción general...

**Sección 1**
* Punto importante 1
* Punto importante 2

**Sección 2**
Detalles relevantes...`;

            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: {
                        role: "user",
                        parts: [{ text: prompt }]
                    },
                    safetySettings: {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_NONE"
                    },
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            const data = await response.json();
            console.log('Respuesta de Gemini:', data);

            if (!response.ok) {
                throw new Error(`Error de API: ${data.error?.message || 'Error desconocido'}`);
            }

            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const newAnswer = {
                    question: question,
                    answer: data.candidates[0].content.parts[0].text,
                    timestamp: new Date().toLocaleTimeString()
                };
                setAnswers(prev => [newAnswer, ...prev]);
                setActiveKey('0'); // Activar la última respuesta
            } else if (data.error) {
                throw new Error(`Error de Gemini: ${data.error.message}`);
            } else {
                console.error('Estructura de respuesta completa:', JSON.stringify(data, null, 2));
                throw new Error('Formato de respuesta inesperado. Revisa la consola para más detalles.');
            }
        } catch (error) {
            console.error('Error detallado:', error);
            alert(`Error al procesar la pregunta: ${error.message}`);
        } finally {
            setLoading(false);
            setQuestion('');
        }
    };

    return (
        <Container fluid className="py-4">
            <div className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <Button 
                        variant="outline-primary" 
                        onClick={() => navigate(-1)}
                        className="me-3"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Volver
                    </Button>
                    <h2 className="d-inline-block mb-0">Análisis de PDF con IA</h2>
                </div>
            </div>
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Body>
                            <div className="text-center">
                                <Form.Group controlId="formFile" className="mb-3">
                                    <div 
                                        className="border rounded p-5" 
                                        style={{ 
                                            cursor: 'pointer',
                                            backgroundColor: '#f8f9fa'
                                        }}
                                        onClick={() => document.getElementById('formFile').click()}
                                    >
                                        <FontAwesomeIcon 
                                            icon={pdfContent ? faCheckCircle : faCloudUploadAlt} 
                                            size="3x" 
                                            className={`mb-3 ${pdfContent ? 'text-success' : 'text-primary'}`}
                                        />
                                        <p className="mb-0">
                                            {file ? file.name : 'Arrastra y suelta un archivo PDF aquí o haz clic para seleccionar'}
                                        </p>
                                        <Form.Control
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </Form.Group>
                                {pdfContent && (
                                    <Alert variant="success" className="mt-3">
                                        <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                        Archivo PDF cargado exitosamente. Ya puedes realizar preguntas sobre su contenido.
                                    </Alert>
                                )}
                            </div>

                            {pdfContent && (
                                <>
                                    {answers.length > 0 && (
                                        <div className="mt-4 mb-4">
                                            <Accordion activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
                                                {answers.map((item, index) => (
                                                    <Accordion.Item key={index} eventKey={index.toString()}>
                                                        <Accordion.Header>
                                                            <div className="d-flex align-items-center w-100 justify-content-between">
                                                                <div className="d-flex align-items-center">
                                                                    <FontAwesomeIcon icon={faQuestionCircle} className="me-2" />
                                                                    <span className="fw-bold">{item.question}</span>
                                                                </div>
                                                                <div className="ms-3 text-muted d-flex align-items-center">
                                                                    <FontAwesomeIcon icon={faClock} className="me-1" />
                                                                    <small>{item.timestamp}</small>
                                                                </div>
                                                            </div>
                                                        </Accordion.Header>
                                                        <Accordion.Body>
                                                            <div 
                                                                className="answer-content"
                                                                style={{
                                                                    whiteSpace: 'pre-line',
                                                                    lineHeight: '1.6',
                                                                    fontSize: '1.1rem'
                                                                }}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: item.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                                                        .split('\n').join('<br/>')
                                                                }}
                                                            />
                                                        </Accordion.Body>
                                                    </Accordion.Item>
                                                ))}
                                            </Accordion>
                                        </div>
                                    )}

                                    <Form onSubmit={handleQuestionSubmit} className="mt-4">
                                        <Form.Group className="mb-3">
                                            <Form.Label>Haz una pregunta sobre el PDF</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={question}
                                                onChange={(e) => setQuestion(e.target.value)}
                                                placeholder="¿Qué te gustaría saber sobre el documento?"
                                                style={{ resize: 'none', height: '100px' }}
                                            />
                                        </Form.Group>
                                        <Button type="submit" variant="primary">
                                            Preguntale a nuestra IA
                                        </Button>
                                    </Form>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {loading && (
                <Row className="mb-4">
                    <Col className="text-center">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Procesando...</span>
                        </Spinner>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default PDFAnalysis;