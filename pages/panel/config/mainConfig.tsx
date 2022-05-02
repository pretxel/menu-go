import { useState } from 'react'
import { Card, Row, Col, Form, Input, Upload, message, Button } from 'antd'
import {
  RiUploadCloud2Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
} from 'react-icons/ri'
const { Dragger } = Upload
type Props = {}
export declare type UploadFileStatus =
  | 'error'
  | 'success'
  | 'done'
  | 'uploading'
  | 'removed'

export interface UploadFile<F = any> {
  uid: string
  size?: number
  name: string
  fileName?: string
  lastModified?: number
  lastModifiedDate?: Date
  url?: string
  status?: UploadFileStatus
  percent?: number
  thumbUrl?: string
  response?: F
  error?: any
  linkProps?: any
  type?: string
  xhr?: F
  preview?: string
}

interface UploadChangeParam<T = UploadFile> {
  file: T
  fileList: UploadFile[]
  event?: {
    percent: number
  }
}

export default function MainConfig({}: Props) {
  const [dataForm, setDataForm] = useState({})
  const [form] = Form.useForm()
  // functions to dragger image
  const onChange = (info: UploadChangeParam) => {
    const data = {
      name: form.getFieldValue('name'),
      address: form.getFieldValue('address'),
      phone: form.getFieldValue('phone'),
      image: info.file.name,
    }
    setDataForm({ ...data })
    const { status } = info.file
    if (status !== 'uploading') {
    }
    if (status === 'done') {
      message.success({
        content: `${info.file.name} file uploaded successfullyyy.`,
        icon: <RiCheckboxCircleLine className="remix-icon" />,
      })
    } else if (status === 'error') {
      message.error({
        content: `${info.file.name} file upload failedddd.`,
        icon: <RiCloseCircleLine className="remix-icon" />,
      })
    }
  }

  // End functions dragger image

  // function to send data
  const handleSubmitForm = async () => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataForm),
    }
    await fetch('/api/post/configPage', options).then((res) => res.json())
  }
  // end function to send data
  return (
    <>
      <div className="hp-p-sm-16 hp-p-24 hp-border-radius hp-border-1 hp-border-color-black-40 hp-border-color-dark-80 hp-bg-color-black-0 hp-bg-color-dark-100 hp-bg-color-black-0">
        <h3 className="hp-mb-24 hp-text-color-black-80 hp-text-color-dark-0">
          Config Page
        </h3>

        <Form
          layout="vertical"
          name="basic"
          initialValues={{ remember: true }}
          form={form}
        >
          <Row gutter={16}>
            <Col md={12} span={24}>
              <Form.Item
                label="Name restaurant / bar"
                name="name"
                rules={[{ required: true, message: 'This area required' }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col md={12} span={24}>
              <Form.Item
                label="Address restaurant / bar"
                name="address"
                rules={[{ required: true, message: 'This area required' }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col md={12} span={24}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[{ required: true, message: 'This area required' }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Card className="hp-border-color-black-40">
              <Row>
                <Col className="hp-mb-16" span={24}>
                  <Row>
                    <Col lg={12} span={20}>
                      <h4>Drag and Drop</h4>
                      <p className="hp-p1-body">
                        You can drag files to a specific area, to upload.
                        Alternatively, you can also upload by selecting.
                      </p>
                    </Col>
                  </Row>
                </Col>

                <Col span={24} className="hp-upload-dragger-col">
                  <Dragger onChange={onChange} maxCount={1}>
                    <p className="ant-upload-drag-icon">
                      <RiUploadCloud2Line className="remix-icon" />
                    </p>

                    <p className="ant-upload-text">
                      Click or drag file to this area to upload
                    </p>

                    <p className="ant-upload-hint">
                      Support for a single or bulk upload. Strictly prohibit
                      from uploading company data or other band files
                    </p>
                  </Dragger>
                </Col>
              </Row>
            </Card>
            <Col span={24} className="hp-mt-16 hp-text-right">
              <Button
                type="primary"
                htmlType="submit"
                onClick={handleSubmitForm}
              >
                Send
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </>
  )
}
