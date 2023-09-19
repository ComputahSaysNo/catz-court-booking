import graphene
from app import queries

schema = graphene.Schema(query=queries.Query)