import { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, CardHeader, CardBody, CardTitle,
  Button, Input, Label, Form, FormGroup, Nav, NavItem, NavLink,
  Table
} from 'reactstrap';
import classNames from 'classnames';
import { Toaster, toast } from 'react-hot-toast';
import { api } from './services/api';
import { Device, DeviceStatus, DeviceInfo } from './types/led-panel';

function App() {
  // Device state managed locally
  const [status, setStatus] = useState<DeviceStatus>({ connected: false });
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  // State management
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'pixels' | 'modes' | 'settings'>('text');
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);

  // Text control state
  const [text, setText] = useState('Hello!');
  const [textColor, setTextColor] = useState('FF00FF');
  const [font, setFont] = useState('CUSONG');
  const [animation, setAnimation] = useState(0);
  const [speed, setSpeed] = useState(80);
  const [rainbowMode, setRainbowMode] = useState(0);
  const [charHeight, setCharHeight] = useState<number | undefined>(16);

  // Clock settings
  const [clockStyle, setClockStyle] = useState(1);
  const [format24, setFormat24] = useState(true);
  const [showDate, setShowDate] = useState(true);

  // Settings state
  const [brightness, setBrightness] = useState(50);
  const [orientation, setOrientation] = useState(0);
  const [isPowered, setIsPowered] = useState(true);

  // Pixel Art state
  const [pixelColor, setPixelColor] = useState('#FF00FF');
  const [pixelGrid, setPixelGrid] = useState<Record<string, string>>({});
  const [savedDesigns, setSavedDesigns] = useState<Array<{name: string, grid: Record<string, string>}>>([]);
  const [designName, setDesignName] = useState('');

  // Image preview state
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Event handlers
  const handleScan = async () => {
    setScanning(true);
    try {
      const foundDevices = await api.scanDevices();
      setDevices(foundDevices);
      toast.success(`Found ${foundDevices.length} device(s)`);
    } catch (error) {
      console.error('Scan failed:', error);
      toast.error('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (address: string) => {
    try {
      await api.connect(address);
      const newStatus = await api.getStatus();
      setStatus(newStatus);

      if (newStatus.connected) {
        const info = await api.getDeviceInfo();
        setDeviceInfo(info);
        toast.success('Connected!');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Connection failed');
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnect();
      const newStatus = await api.getStatus();
      setStatus(newStatus);
      setDeviceInfo(null);
      toast.success('Disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast.error('Disconnect failed');
    }
  };

  const handleSendText = async () => {
    if (!status.connected) {
      toast.error('Connect to device first');
      return;
    }
    try {
      await api.sendText({
        text,
        color: textColor,
        font,
        animation,
        speed,
        rainbow_mode: rainbowMode,
        char_height: charHeight,
      });
      toast.success('Text sent');
    } catch (error) {
      console.error('Send text failed:', error);
      toast.error('Failed to send text');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));

    if (!status.connected) {
      toast.error('Connect to device first');
      return;
    }

    try {
      await api.sendImage(file);
      toast.success('Image sent!');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to send image');
    }
  };

  const handlePixelClick = (x: number, y: number) => {
    const key = `${x},${y}`;
    setPixelGrid(prev => {
      const newGrid = { ...prev };
      if (newGrid[key] === pixelColor) {
        delete newGrid[key];
      } else {
        newGrid[key] = pixelColor;
      }
      return newGrid;
    });
  };

  const handleSendPixels = async () => {
    if (!status.connected) {
      toast.error('Connect to device first');
      return;
    }

    const pixelCount = Object.keys(pixelGrid).length;
    if (pixelCount === 0) {
      toast.error('No pixels to send');
      return;
    }

    try {
      await api.setMode('diy');

      const pixels = Object.entries(pixelGrid).map(([coords, color]) => {
        const [x, y] = coords.split(',').map(Number);
        return {
          x,
          y,
          color: color.replace('#', '')
        };
      });

      await api.sendPixels(pixels);
      toast.success(`${pixelCount} pixels sent!`);
    } catch (error) {
      console.error('Send pixels failed:', error);
      toast.error('Failed to send pixels');
    }
  };

  const handleSetClockMode = async () => {
    if (!status.connected) {
      toast.error('Connect to device first');
      return;
    }
    try {
      await api.setClockMode({ style: clockStyle, format_24: format24, show_date: showDate });
      toast.success('Clock mode activated');
    } catch (error) {
      console.error('Failed to set clock mode:', error);
      toast.error('Failed to set clock mode');
    }
  };

  const handleSetBrightness = async (value: number) => {
    setBrightness(value);
    if (!status.connected) return;
    try {
      await api.setBrightness({ brightness: value });
    } catch (error) {
      console.error('Failed to set brightness:', error);
    }
  };

  const handleSetOrientation = async (value: number) => {
    setOrientation(value);
    if (!status.connected) return;
    try {
      await api.setOrientation({ orientation: value });
      toast.success('Orientation updated');
    } catch (error) {
      console.error('Failed to set orientation:', error);
      toast.error('Failed to set orientation');
    }
  };

  const handleTogglePower = async () => {
    if (!status.connected) {
      toast.error('Connect to device first');
      return;
    }
    try {
      await api.setPower({ on: !isPowered });
      setIsPowered(!isPowered);
      toast.success(isPowered ? 'Power OFF' : 'Power ON');
    } catch (error) {
      console.error('Failed to toggle power:', error);
      toast.error('Failed to toggle power');
    }
  };

  // Pixel Art Design Management
  const handleSaveDesign = () => {
    if (!designName.trim()) {
      toast.error('Please enter a design name');
      return;
    }
    if (Object.keys(pixelGrid).length === 0) {
      toast.error('No pixels to save');
      return;
    }

    const newDesign = { name: designName, grid: { ...pixelGrid } };
    const updatedDesigns = [...savedDesigns, newDesign];
    setSavedDesigns(updatedDesigns);
    localStorage.setItem('pixelDesigns', JSON.stringify(updatedDesigns));
    setDesignName('');
    toast.success(`Design "${designName}" saved!`);
  };

  const handleLoadDesign = (design: {name: string, grid: Record<string, string>}) => {
    setPixelGrid(design.grid);
    toast.success(`Design "${design.name}" loaded!`);
  };

  const handleDeleteDesign = (designName: string) => {
    const updatedDesigns = savedDesigns.filter(d => d.name !== designName);
    setSavedDesigns(updatedDesigns);
    localStorage.setItem('pixelDesigns', JSON.stringify(updatedDesigns));
    toast.success(`Design "${designName}" deleted`);
  };

  // Load saved designs on mount
  useEffect(() => {
    const saved = localStorage.getItem('pixelDesigns');
    if (saved) {
      try {
        setSavedDesigns(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved designs:', error);
      }
    }
  }, []);

  // Check connection status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const currentStatus = await api.getStatus();
        setStatus(currentStatus);
        if (currentStatus.connected) {
          const info = await api.getDeviceInfo();
          setDeviceInfo(info);
        }
      } catch (error) {
        console.error('Failed to get status:', error);
      }
    };
    checkStatus();
  }, [setStatus, setDeviceInfo]);

  return (
    <div className="wrapper">
      <Toaster position="top-right" />

      <div className="main-panel" style={{ width: '100%' }}>
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-absolute navbar-transparent">
          <Container fluid>
            <div className="navbar-wrapper">
              <div className="navbar-brand">
                <h3 className="mb-0">PixelArt Controller</h3>
              </div>
            </div>
            <div className="ml-auto">
              {status.connected && (
                <span className="badge badge-success">
                  Connected to {status.device_address}
                </span>
              )}
            </div>
          </Container>
        </nav>

        {/* Main Content */}
        <div className="content">
          <Container fluid>
            <Row>
              <Col md="12">
                {/* Tabs Navigation */}
                <Card>
                  <CardBody>
                    <Nav tabs>
                      <NavItem>
                        <NavLink
                          className={classNames({ active: activeTab === 'text' })}
                          onClick={() => setActiveTab('text')}
                          style={{ cursor: 'pointer' }}
                        >
                          Text
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={classNames({ active: activeTab === 'image' })}
                          onClick={() => setActiveTab('image')}
                          style={{ cursor: 'pointer' }}
                        >
                          Image
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={classNames({ active: activeTab === 'pixels' })}
                          onClick={() => setActiveTab('pixels')}
                          style={{ cursor: 'pointer' }}
                        >
                          Pixel Art
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={classNames({ active: activeTab === 'modes' })}
                          onClick={() => setActiveTab('modes')}
                          style={{ cursor: 'pointer' }}
                        >
                          Modes
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={classNames({ active: activeTab === 'settings' })}
                          onClick={() => setActiveTab('settings')}
                          style={{ cursor: 'pointer' }}
                        >
                          Settings
                        </NavLink>
                      </NavItem>
                    </Nav>

                    {/* Tab Content */}
                    <div className="tab-content mt-4">
                      {/* TEXT TAB */}
                      {activeTab === 'text' && (
                        <Card>
                          <CardHeader>
                            <CardTitle tag="h4">Send Text</CardTitle>
                          </CardHeader>
                          <CardBody>
                            <Form>
                              <FormGroup>
                                <Label>Text Message</Label>
                                <Input
                                  type="text"
                                  value={text}
                                  onChange={(e) => setText(e.target.value)}
                                  placeholder="Enter text to display..."
                                />
                              </FormGroup>

                              <Row>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Color (Hex)</Label>
                                    <Input
                                      type="text"
                                      value={textColor}
                                      onChange={(e) => setTextColor(e.target.value.replace('#', ''))}
                                      placeholder="FF00FF"
                                    />
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Font</Label>
                                    <Input
                                      type="select"
                                      value={font}
                                      onChange={(e) => setFont(e.target.value)}
                                    >
                                      <option value="CUSONG">CUSONG</option>
                                      <option value="SIMSUN">SIMSUN</option>
                                      <option value="VCR_OSD_MONO">VCR OSD MONO</option>
                                    </Input>
                                  </FormGroup>
                                </Col>
                              </Row>

                              <Row>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Text Size</Label>
                                    <Input
                                      type="select"
                                      value={charHeight}
                                      onChange={(e) => setCharHeight(Number(e.target.value))}
                                    >
                                      <option value={16}>Small (16px)</option>
                                      <option value={20}>Medium (20px)</option>
                                      <option value={24}>Large (24px)</option>
                                      <option value={32}>Extra Large (32px)</option>
                                    </Input>
                                  </FormGroup>
                                </Col>
                                <Col md="6">
                                  <FormGroup>
                                    <Label>Animation</Label>
                                    <Input
                                      type="select"
                                      value={animation}
                                      onChange={(e) => setAnimation(Number(e.target.value))}
                                    >
                                      <option value={0}>None</option>
                                      <option value={1}>Scroll Left</option>
                                      <option value={2}>Scroll Right</option>
                                      <option value={3}>Scroll Up</option>
                                      <option value={4}>Scroll Down</option>
                                    </Input>
                                  </FormGroup>
                                </Col>
                              </Row>

                              <FormGroup>
                                <Label>Speed: {speed}%</Label>
                                <Input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={speed}
                                  onChange={(e) => setSpeed(Number(e.target.value))}
                                />
                              </FormGroup>

                              <FormGroup>
                                <Label>Rainbow Mode</Label>
                                <Input
                                  type="select"
                                  value={rainbowMode}
                                  onChange={(e) => setRainbowMode(Number(e.target.value))}
                                >
                                  {Array.from({ length: 10 }, (_, i) => (
                                    <option key={i} value={i}>Style {i}</option>
                                  ))}
                                </Input>
                              </FormGroup>

                              <Button color="primary" size="lg" block onClick={handleSendText}>
                                Send Text
                              </Button>
                            </Form>
                          </CardBody>
                        </Card>
                      )}

                      {/* IMAGE TAB */}
                      {activeTab === 'image' && (
                        <Card>
                          <CardHeader>
                            <CardTitle tag="h4">Upload Image</CardTitle>
                          </CardHeader>
                          <CardBody>
                            <FormGroup>
                              <Label>Select Image (PNG, GIF, JPEG)</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                            </FormGroup>
                            {imagePreview && (
                              <div className="text-center mt-3">
                                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      )}

                      {/* PIXEL ART TAB */}
                      {activeTab === 'pixels' && (
                        <Card>
                          <CardHeader>
                            <CardTitle tag="h4">Pixel Art Editor</CardTitle>
                          </CardHeader>
                          <CardBody>
                            <FormGroup>
                              <Label>Pixel Color</Label>
                              <Input
                                type="color"
                                value={pixelColor}
                                onChange={(e) => setPixelColor(e.target.value)}
                              />
                            </FormGroup>

                            <div className="d-flex justify-content-center mb-3">
                              {deviceInfo ? (
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${deviceInfo.width}, 16px)`,
                                    gap: '1px',
                                    border: '2px solid #ccc'
                                  }}
                                >
                                  {Array.from({ length: deviceInfo.width * deviceInfo.height }).map((_, index) => {
                                    const x = index % deviceInfo.width;
                                    const y = Math.floor(index / deviceInfo.width);
                                    const pixelKey = `${x},${y}`;
                                    const color = pixelGrid[pixelKey] || '#000000';

                                    return (
                                      <div
                                        key={index}
                                        onClick={() => handlePixelClick(x, y)}
                                        style={{
                                          width: '16px',
                                          height: '16px',
                                          backgroundColor: color,
                                          cursor: 'pointer',
                                          border: '1px solid #555'
                                        }}
                                        title={`(${x}, ${y})`}
                                      />
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-muted">Connect to a device to start drawing</p>
                              )}
                            </div>

                            {/* Save Design */}
                            <Row className="mt-4">
                              <Col md="8">
                                <Input
                                  type="text"
                                  placeholder="Design name..."
                                  value={designName}
                                  onChange={(e) => setDesignName(e.target.value)}
                                />
                              </Col>
                              <Col md="4">
                                <Button color="success" block onClick={handleSaveDesign}>
                                  Save Design
                                </Button>
                              </Col>
                            </Row>

                            {/* Saved Designs List */}
                            {savedDesigns.length > 0 && (
                              <div className="mt-3">
                                <Label>Saved Designs</Label>
                                <div className="table-responsive" style={{ overflow: 'visible' }}>
                                  <Table size="sm">
                                    <tbody>
                                      {savedDesigns.map((design, index) => (
                                        <tr key={index}>
                                          <td>{design.name}</td>
                                          <td className="text-right">
                                            <Button
                                              size="sm"
                                              color="info"
                                              onClick={() => handleLoadDesign(design)}
                                              className="mr-2"
                                            >
                                              Load
                                            </Button>
                                            <Button
                                              size="sm"
                                              color="danger"
                                              onClick={() => handleDeleteDesign(design.name)}
                                            >
                                              Delete
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              </div>
                            )}

                            <Row className="mt-3">
                              <Col md="6">
                                <Button color="danger" block onClick={() => setPixelGrid({})}>
                                  Clear Grid
                                </Button>
                              </Col>
                              <Col md="6">
                                <Button color="primary" block onClick={handleSendPixels}>
                                  Send Pixels
                                </Button>
                              </Col>
                            </Row>
                          </CardBody>
                        </Card>
                      )}

                      {/* MODES TAB */}
                      {activeTab === 'modes' && (
                        <Row>
                          <Col md="12">
                            <Card>
                              <CardHeader>
                                <CardTitle tag="h4">Clock Mode</CardTitle>
                              </CardHeader>
                              <CardBody>
                                <FormGroup>
                                  <Label>Clock Style</Label>
                                  <Input
                                    type="select"
                                    value={clockStyle}
                                    onChange={(e) => setClockStyle(Number(e.target.value))}
                                  >
                                    {Array.from({ length: 9 }, (_, i) => (
                                      <option key={i} value={i}>Style {i}</option>
                                    ))}
                                  </Input>
                                </FormGroup>
                                <Row className="mb-3">
                                  <Col md="6">
                                    <Button
                                      color={format24 ? 'success' : 'secondary'}
                                      block
                                      onClick={() => setFormat24(!format24)}
                                    >
                                      24h: {format24 ? 'ON' : 'OFF'}
                                    </Button>
                                  </Col>
                                  <Col md="6">
                                    <Button
                                      color={showDate ? 'success' : 'secondary'}
                                      block
                                      onClick={() => setShowDate(!showDate)}
                                    >
                                      Date: {showDate ? 'ON' : 'OFF'}
                                    </Button>
                                  </Col>
                                </Row>
                                <Button color="primary" block onClick={handleSetClockMode}>
                                  Activate Clock Mode
                                </Button>
                              </CardBody>
                            </Card>
                          </Col>
                        </Row>
                      )}

                      {/* SETTINGS TAB */}
                      {activeTab === 'settings' && (
                        <>
                          {/* Device Connection Card */}
                          <Card>
                            <CardHeader>
                              <CardTitle tag="h4">Device Connection</CardTitle>
                            </CardHeader>
                            <CardBody>
                              <Row>
                                <Col md="6">
                                  <Button color="primary" onClick={handleScan} disabled={scanning}>
                                    {scanning ? 'Scanning...' : 'Scan for Devices'}
                                  </Button>
                                </Col>
                                {status.connected && (
                                  <Col md="6" className="text-right">
                                    <Button color="danger" onClick={handleDisconnect}>
                                      Disconnect
                                    </Button>
                                  </Col>
                                )}
                              </Row>

                              {devices.length > 0 && (
                                <div className="table-responsive" style={{ overflow: 'visible' }}>
                                  <Table className="mt-3">
                                    <thead>
                                      <tr>
                                        <th>Name</th>
                                        <th>Address</th>
                                        <th>RSSI</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {devices.map((device) => (
                                        <tr key={device.address}>
                                          <td>{device.name}</td>
                                          <td>{device.address}</td>
                                          <td>{device.rssi}</td>
                                          <td>
                                            <Button
                                              size="sm"
                                              color="info"
                                              onClick={() => handleConnect(device.address)}
                                              disabled={status.connected && status.device_address === device.address}
                                            >
                                              {status.connected && status.device_address === device.address ? 'Connected' : 'Connect'}
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              )}
                            </CardBody>
                          </Card>

                          {/* Panel Settings Card */}
                          <Card>
                            <CardHeader>
                              <CardTitle tag="h4">Panel Settings</CardTitle>
                            </CardHeader>
                            <CardBody>
                              <FormGroup>
                                <Label>Brightness: {brightness}%</Label>
                                <Input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={brightness}
                                  onChange={(e) => handleSetBrightness(Number(e.target.value))}
                                />
                              </FormGroup>

                            <FormGroup>
                              <Label>Orientation</Label>
                              <Input
                                type="select"
                                value={orientation}
                                onChange={(e) => handleSetOrientation(Number(e.target.value))}
                              >
                                <option value={0}>0° (Normal)</option>
                                <option value={1}>90° (Right)</option>
                                <option value={2}>180° (Inverted)</option>
                                <option value={3}>270° (Left)</option>
                              </Input>
                            </FormGroup>

                            <FormGroup>
                              <Button
                                color={isPowered ? 'danger' : 'success'}
                                block
                                onClick={handleTogglePower}
                              >
                                {isPowered ? 'Power OFF' : 'Power ON'}
                              </Button>
                            </FormGroup>

                            {deviceInfo && (
                              <div className="mt-4">
                                <h5>Device Information</h5>
                                <Table bordered size="sm">
                                  <tbody>
                                    <tr>
                                      <td><strong>Dimensions:</strong></td>
                                      <td>{deviceInfo.width} x {deviceInfo.height}</td>
                                    </tr>
                                    <tr>
                                      <td><strong>Device Type:</strong></td>
                                      <td>{deviceInfo.device_type}</td>
                                    </tr>
                                    <tr>
                                      <td><strong>LED Type:</strong></td>
                                      <td>{deviceInfo.led_type}</td>
                                    </tr>
                                    <tr>
                                      <td><strong>WiFi:</strong></td>
                                      <td>{deviceInfo.has_wifi ? 'Yes' : 'No'}</td>
                                    </tr>
                                  </tbody>
                                </Table>
                              </div>
                            )}
                          </CardBody>
                        </Card>
                        </>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    </div>
  );
}

export default App;
