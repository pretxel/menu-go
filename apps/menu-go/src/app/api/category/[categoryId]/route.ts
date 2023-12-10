import prisma from '../../../../lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  const dishDelete = await prisma.category.delete({
    where: { id: params.categoryId },
  });

  return Response.json({ id: dishDelete.id });
}
