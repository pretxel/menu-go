import { useState, useEffect } from 'react'
import {
    Row,
    Col,
    Empty,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Collapse,
    Tag,
} from 'antd'
import { RiCloseFill, RiArrowRightSLine } from 'react-icons/ri'
import defaultCategories from '@lib/defaultCategories.json'

// import pizza from '@utils/dummyImages/categories/pizza.webp'
// import hamburguer from '@utils/dummyImages/categories/hamburguer.webp'
// import tacos from '@utils/dummyImages/categories/tacos.webp'
// import pasta from '@utils/dummyImages/categories/pastas.webp'
// import drinks from '@utils/dummyImages/categories/drinks.webp'

type Props = {}

interface defaultDish {
    id?: string
    name: string
    categories: string
}
interface defaultDishArray extends Array<defaultDish> {}

export default function MainDishes({}: Props) {
    const [dishData, setDishData] = useState<defaultDishArray>([])
    const [categories, setCategories] = useState(defaultCategories)
    const [FormModalVisible, setFormModalVisible] = useState(false)
    const [form] = Form.useForm()
    const { Panel } = Collapse

    // actions modal
    const showFormModal = () => setFormModalVisible(true)
    const handleFormCancel = () => setFormModalVisible(false)
    //end actions modal

    // Fetch categories when click in modal
    const handleFetchCategories = async () => {
        await fetch('/api/get/categories')
            .then((res) => res.json())
            .then((data) => setCategories([...categories, ...data]))
    }
    // end

    // Send PostData Dish
    const handleSubmitForm = async () => {
        const dataForm = {
            name: form.getFieldValue('dish'),
            categories: form.getFieldValue('category'),
        }
        setDishData([...dishData, dataForm])
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataForm),
        }
        await fetch('/api/post/dishes', options).then((res) => res.json())
        setFormModalVisible(false)
    }
    // end send post data dish

    // Render if doesnt exist any category
    const dishesLengthEmpty = dishData.length === 0 && (
        <Empty
            description={
                <span className="hp-text-color-dark-30">Nothing to show</span>
            }
        >
            <Button type="primary" ghost onClick={showFormModal}>
                Add Dish
            </Button>
        </Empty>
    )

    //  Render if exists dishes
    const dishesLengthFull =
        dishData.length > 0 ? (
            <Row align="stretch" justify="space-between">
                <Col>
                    <h3 className="hp-mb-24 hp-text-color-black-80 hp-text-color-dark-0">
                        Dishes
                    </h3>
                </Col>
                <Col>
                    <Button type="primary" ghost onClick={showFormModal}>
                        Add Dish
                    </Button>
                </Col>
            </Row>
        ) : (
            dishesLengthEmpty
        )
    // end render

    // Modal render
    const modalRender = (
        <Modal
            title="Dish"
            width={416}
            visible={FormModalVisible}
            onCancel={handleFormCancel}
            footer={null}
            closeIcon={
                <RiCloseFill
                    className="remix-icon text-color-black-100"
                    size={24}
                />
            }
        >
            <Form
                layout="vertical"
                name="basic"
                initialValues={{ remember: true }}
                form={form}
            >
                <Form.Item
                    label="Dish"
                    name="dish"
                    rules={[
                        { required: true, message: 'Please add the dish!' },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Category"
                    name="category"
                    rules={[
                        {
                            required: true,
                            message: 'Please select the category!',
                        },
                    ]}
                >
                    <Select onClick={() => handleFetchCategories()}>
                        {categories.map((category) => (
                            <Select.Option
                                value={category.name}
                                key={category.id}
                            >
                                {category.name}
                            </Select.Option>
                        ))}
                    </Select>
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
    )
    // end modal

    // const arrayImageFoods: { [key: string]: string }[] = [
    //   {
    //     0: pizza.src,
    //     1: hamburguer.src,
    //     2: pasta.src,
    //     3: drinks.src,
    //     4: tacos.src,
    //   },
    // ]
    // const randomImage = () => {
    //   for (const iterator of arrayImageFoods) {
    //     const random: number = Math.floor(Math.random() * (4 - 1 + 1) + 1)
    //     return iterator[random]
    //   }
    // }

    const genExtra = () => (
        <RiArrowRightSLine
            size={24}
            className="hp-collapse-arrow hp-text-color-black-60"
        />
    )

    // groupBy categories
    const groupByKey = (array: defaultDishArray, key: string) => {
        return array.reduce(
            (
                previous: { [key: string]: any },
                currentObject: { [key: string]: any }
            ) => {
                let newThing = Object.assign(previous, {
                    [currentObject[key]]: (
                        previous[currentObject[key]] || []
                    ).concat(currentObject),
                })
                return newThing
            },
            {}
        )
    }

    const categoriesString: string = 'categories'
    const result = groupByKey(dishData, categoriesString)
    // end groupby categories

    useEffect(() => {
        fetch('/api/get/dishes')
            .then((res) => res.json())
            .then((data) => setDishData([...dishData, ...data]))
    })

    return (
        <div className="hp-p-sm-16 hp-p-24 hp-border-radius hp-border-1 hp-border-color-black-40 hp-border-color-dark-80 hp-bg-color-black-0 hp-bg-color-dark-100 hp-bg-color-black-0">
            {dishesLengthFull}
            {modalRender}

            {Object.keys(result).map((dish) => (
                <Collapse defaultActiveKey={['1']} key={dish}>
                    <Panel
                        header={
                            <p className="hp-d-flex-center hp-p1-body hp-mb-0">
                                <Tag className="hp-ml-16" color="blue">
                                    {dish}
                                </Tag>
                            </p>
                        }
                        key="1"
                        showArrow={false}
                        extra={genExtra()}
                    >
                        {result[dish].map((dash: defaultDish) => (
                            <p className="hp-p1-body" key={dash.id}>
                                {dash.name}
                            </p>
                        ))}
                    </Panel>
                </Collapse>
            ))}
        </div>
    )
}
