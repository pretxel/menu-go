import prisma from '../../../../lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dishId: string }> }
) {
  const { dishId } = await params;
  const dishDelete = await prisma.dishes.delete({
    where: { id: dishId },
  });

  return Response.json({ id: dishDelete.id });
}
