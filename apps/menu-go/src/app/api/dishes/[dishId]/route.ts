import prisma from '../../../../lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { dishId: string } }
) {
  const dishDelete = await prisma.dishes.delete({
    where: { id: params.dishId },
  });

  return Response.json({ id: dishDelete.id });
}
