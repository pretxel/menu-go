import { useEffect, useState } from 'react'
import { RiCloseFill, RiEditFill, RiDeleteBin6Fill } from 'react-icons/ri'
import { Empty, Form, Input, Row, Col, Button, Modal } from 'antd'
import defaultCategory from '@lib/defaultCategories.json'

import pizza from '@utils/dummyImages/categories/pizza.webp'
import hamburguer from '@utils/dummyImages/categories/hamburguer.webp'
import tacos from '@utils/dummyImages/categories/tacos.webp'
import pasta from '@utils/dummyImages/categories/pastas.webp'
import drinks from '@utils/dummyImages/categories/drinks.webp'

type Props = {}
interface defaulCategory {
  id?: string
  name: string
  description: string
}
interface defaultCategoryArray extends Array<defaulCategory> {}

export default function MainCategory({}: Props) {
  const [categoriesData, setCategoriesData] =
    useState<defaultCategoryArray>(defaultCategory)
  const [FormModalVisible, setFormModalVisible] = useState(false)

  const [form] = Form.useForm()
  const showFormModal = () => {
    setFormModalVisible(true)
  }
  const handleFormCancel = () => {
    setFormModalVisible(false)
  }

  useEffect(() => {
    fetch('/api/get/categories')
      .then((res) => res.json())
      .then((data) => setCategoriesData([...categoriesData, ...data]))
  }, [])

  // function to send data
  const handleSubmitForm = async () => {
    const dataForm = {
      name: form.getFieldValue('category'),
      description: form.getFieldValue('description')
        ? form.getFieldValue('description')
        : '',
    }
    setCategoriesData([...categoriesData, dataForm])
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataForm),
    }
    await fetch('/api/post/categories', options).then((res) => res.json())
    setFormModalVisible(false)
  }
  // end function to send data
  // random image

  const arrayImageFoods: { [key: string]: string }[] = [
    {
      0: pizza.src,
      1: hamburguer.src,
      2: pasta.src,
      3: drinks.src,
      4: tacos.src,
    },
  ]
  const randomImage = () => {
    for (const iterator of arrayImageFoods) {
      const random: number = Math.floor(Math.random() * (4 - 1 + 1) + 1)
      return iterator[random]
    }
  }
  // end random image

  // Render if doesnt exist any category
  const categoriesLength = categoriesData.length === 0 && (
    <Empty
      description={
        <span className="hp-text-color-dark-30">Nothing to show</span>
      }
    >
      <Button type="primary" ghost onClick={showFormModal}>
        Add Category
      </Button>
    </Empty>
  )

  return (
    <div className="hp-p-sm-16 hp-p-24 hp-border-radius hp-border-1 hp-border-color-black-40 hp-border-color-dark-80 hp-bg-color-black-0 hp-bg-color-dark-100 hp-bg-color-black-0">
      <Row align="stretch" justify="space-between">
        <Col>
          <h3 className="hp-mb-24 hp-text-color-black-80 hp-text-color-dark-0">
            Categories
          </h3>
        </Col>
        <Col>
          <Button type="primary" ghost onClick={showFormModal}>
            Add Category
          </Button>
        </Col>
      </Row>
      {categoriesLength}
      <Col span={24}>
        <Row
          style={{ marginLeft: -16, marginRight: -16, columnGap: '16px' }}
          justify="space-around"
        >
          {categoriesData.map((categ) => (
            <Col
              md={10}
              span={24}
              className="hp-px-16 hp-mb-18 hp-bg-black-0 hp-bg-dark-100 hp-border-1 hp-border-color-black-40 hp-border-color-dark-80 hp-border-radius hp-p-8"
              key={categ.id}
            >
              <Row align="middle">
                <Col style={{ marginRight: '18px' }}>
                  <div
                    className="hp-mr-18 hp-border-radius"
                    style={{
                      minWidth: 64,
                      height: 64,
                      backgroundImage: 'url(' + randomImage() + ')',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  ></div>
                </Col>

                <Col flex="1 0 0" className="hp-overflow-hidden">
                  <span className="hp-d-block h5 hp-text-color-black-100 hp-text-color-dark-0">
                    {categ.name}
                  </span>
                  <p
                    className="hp-p1-body hp-text-overflow-ellipsis hp-text-color-black-80 hp-text-color-dark-20 hp-mb-4"
                    title={categ.description}
                  >
                    {categ.description}
                  </p>
                </Col>
                <Col
                  style={{ marginRight: '12px' }}
                  className="hp-cursor-pointer hp-hover-text-color-primary-1"
                >
                  <RiEditFill size={20} onClick={showFormModal} />
                </Col>
                <Col className="hp-cursor-pointer hp-hover-text-color-danger-2">
                  <RiDeleteBin6Fill size={20} />
                </Col>
              </Row>
            </Col>
          ))}
        </Row>
      </Col>

      <Modal
        title="Category"
        width={416}
        visible={FormModalVisible}
        onCancel={handleFormCancel}
        footer={null}
        closeIcon={
          <RiCloseFill className="remix-icon text-color-black-100" size={24} />
        }
      >
        <Form
          layout="vertical"
          name="basic"
          initialValues={{ remember: true }}
          form={form}
        >
          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please add the category!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea />
          </Form.Item>

          <Form.Item>
            <Button
              block
              type="primary"
              htmlType="submit"
              onClick={handleSubmitForm}
            >
              Add
            </Button>
          </Form.Item>
        </Form>

        <Button block type="text" onClick={handleFormCancel}>
          Cancel
        </Button>
      </Modal>
    </div>
  )
}
